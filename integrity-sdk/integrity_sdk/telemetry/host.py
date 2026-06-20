import os
import psutil
import threading
import time
import math
from typing import Set, Dict
from .core import get_meter
from .conventions import IntegrityAttributes

class HostTelemetrySampler:
    """
    Periodically samples host-level I/O and network metrics for the current process.
    Calculates Storage Flux (RW Ratio, Path Entropy) and Network IP Entropy.
    """
    def __init__(self, interval_sec: float = 10.0):
        self.interval_sec = interval_sec
        self.process = psutil.Process(os.getpid())
        self.meter = get_meter("integrity_host_telemetry")
        
        # Metrics
        self.rw_ratio_gauge = self.meter.create_gauge(
            IntegrityAttributes.STORAGE_FLUX_RW_RATIO,
            description="Ratio of bytes written to bytes read"
        )
        self.path_entropy_gauge = self.meter.create_gauge(
            IntegrityAttributes.ACCESS_PATH_ENTROPY,
            description="Entropy of file access paths"
        )
        self.ip_entropy_gauge = self.meter.create_gauge(
            IntegrityAttributes.DESTINATION_IP_ENTROPY,
            description="Entropy of destination IP addresses"
        )

        self._last_metrics = {
            "rw_ratio": 0.0,
            "path_entropy": 0.0,
            "ip_entropy": 0.0,
            "cpu_percent": 0.0
        }
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def get_current_metrics(self) -> Dict[str, float]:
        """Returns the latest snapshot of sampled host metrics."""
        return self._last_metrics.copy()

    def start(self):
        if self._thread is not None:
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join()
            self._thread = None

    def _run(self):
        while not self._stop_event.is_set():
            try:
                self.sample()
            except Exception as e:
                # Log to stderr or OTel error?
                pass
            time.sleep(self.interval_sec)

    def sample(self):
        # 1. Storage Flux (RW Ratio)
        io_counters = self.process.io_counters()
        read_bytes = io_counters.read_bytes
        write_bytes = io_counters.write_bytes
        rw_ratio = write_bytes / read_bytes if read_bytes > 0 else 0.0
        self.rw_ratio_gauge.set(rw_ratio)
        self._last_metrics["rw_ratio"] = rw_ratio

        # 2. Access Path Entropy
        open_files = self.process.open_files()
        paths = [f.path for f in open_files]
        path_entropy = self._calculate_entropy(paths)
        self.path_entropy_gauge.set(path_entropy)
        self._last_metrics["path_entropy"] = path_entropy

        # 3. Network Flow (IP Entropy)
        connections = self.process.connections(kind='inet')
        remote_ips = [conn.raddr.ip for conn in connections if conn.raddr]
        ip_entropy = self._calculate_entropy(remote_ips)
        self.ip_entropy_gauge.set(ip_entropy)
        self._last_metrics["ip_entropy"] = ip_entropy

        # 4. CPU usage
        cpu_percent = self.process.cpu_percent()
        self._last_metrics["cpu_percent"] = cpu_percent

    def _calculate_entropy(self, items: list) -> float:
        if not items:
            return 0.0
        counts = {}
        for item in items:
            counts[item] = counts.get(item, 0) + 1
        
        entropy = 0.0
        total = len(items)
        for count in counts.values():
            p = count / total
            entropy -= p * math.log2(p)
        return entropy
