import time
import os
import psutil
import subprocess
from typing import Dict, Any, Optional

class InferenceMetadataExtractor:
    """
    Standardised extractor to parse, normalize, and extract premium cognitive 
    telemetry from any inference provider or pipeline.
    """

    @staticmethod
    def extract_openai(response: Dict[str, Any]) -> Dict[str, Any]:
        """Parses standard OpenAI chat completion response objects."""
        extracted = {}
        if not response:
            return extracted

        # Core usage metrics
        usage = response.get("usage", {})
        extracted["prompt_tokens"] = usage.get("prompt_tokens")
        extracted["completion_tokens"] = usage.get("completion_tokens")
        extracted["total_tokens"] = usage.get("total_tokens")

        # Model metadata
        extracted["model_name"] = response.get("model")
        extracted["system_fingerprint"] = response.get("system_fingerprint")

        # Choice metrics
        choices = response.get("choices", [])
        if choices:
            first_choice = choices[0]
            extracted["finish_reason"] = first_choice.get("finish_reason")
            message = first_choice.get("message", {})
            extracted["text_output"] = message.get("content")
            
            # Extract logprobs if available
            logprobs_data = message.get("logprobs")
            if logprobs_data and "content" in logprobs_data:
                token_logprobs = [t.get("logprob") for t in logprobs_data["content"] if t.get("logprob") is not None]
                extracted["token_logprobs"] = token_logprobs

        # Auto-compute pricing heuristics if possible (OpenAI defaults)
        model = extracted.get("model_name", "").lower()
        if "gpt-4o" in model:
            extracted["estimated_cost_usd"] = (
                (extracted.get("prompt_tokens", 0) * 0.000005) + 
                (extracted.get("completion_tokens", 0) * 0.000015)
            )
        elif "gpt-3.5" in model:
            extracted["estimated_cost_usd"] = (
                (extracted.get("prompt_tokens", 0) * 0.000001) + 
                (extracted.get("completion_tokens", 0) * 0.000002)
            )
        
        return extracted

    @staticmethod
    def extract_anthropic(response: Dict[str, Any]) -> Dict[str, Any]:
        """Parses Anthropic Claude message API response objects."""
        extracted = {}
        if not response:
            return extracted

        usage = response.get("usage", {})
        extracted["prompt_tokens"] = usage.get("input_tokens")
        extracted["completion_tokens"] = usage.get("output_tokens")
        extracted["total_tokens"] = (extracted["prompt_tokens"] or 0) + (extracted["completion_tokens"] or 0)

        extracted["model_name"] = response.get("model")
        extracted["finish_reason"] = response.get("stop_reason")

        content = response.get("content", [])
        if content:
            # Extract main text
            text_blocks = [block.get("text", "") for block in content if block.get("type") == "text"]
            extracted["text_output"] = "\n".join(text_blocks)

        # Anthropic standard pricing heuristics
        model = extracted.get("model_name", "").lower()
        if "claude-3-opus" in model:
            extracted["estimated_cost_usd"] = (
                (extracted.get("prompt_tokens", 0) * 0.000015) + 
                (extracted.get("completion_tokens", 0) * 0.000075)
            )
        elif "claude-3-5-sonnet" in model:
            extracted["estimated_cost_usd"] = (
                (extracted.get("prompt_tokens", 0) * 0.000003) + 
                (extracted.get("completion_tokens", 0) * 0.000015)
            )

        return extracted

    @staticmethod
    def extract_huggingface(pipeline_output: Any, model_name: str) -> Dict[str, Any]:
        """Parses HuggingFace pipeline generation outcomes."""
        extracted = {"model_name": model_name}
        if not pipeline_output:
            return extracted

        if isinstance(pipeline_output, list) and len(pipeline_output) > 0:
            item = pipeline_output[0]
            if isinstance(item, dict):
                extracted["text_output"] = item.get("generated_text")
        elif isinstance(pipeline_output, dict):
            extracted["text_output"] = pipeline_output.get("generated_text")

        return extracted

    @staticmethod
    def extract_system_telemetry(enable_full_recording: bool = False) -> Dict[str, Any]:
        """Extracts deep execution environment information, including CPU, VRAM, and GPU state."""
        from .hardware import get_mac_address, get_hostname

        telemetry = {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "pid": os.getpid(),
            "mac_address": get_mac_address(),
            "hostname": get_hostname(),
        }

        # Resolve primary network interface local IP
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            telemetry["local_ip"] = s.getsockname()[0]
            s.close()
        except Exception:
            try:
                import socket
                telemetry["local_ip"] = socket.gethostbyname(socket.gethostname())
            except Exception:
                telemetry["local_ip"] = "127.0.0.1"

        # Extract OS and Runtime environment
        try:
            import platform
            import getpass
            telemetry["os_platform"] = platform.platform()
            telemetry["python_version"] = platform.python_version()
            telemetry["username"] = getpass.getuser()
        except Exception:
            pass

        # Extract active Git VCS state if running inside a repository
        try:
            commit_hash = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, timeout=1
            ).decode().strip()
            telemetry["git_commit_hash"] = commit_hash

            branch_name = subprocess.check_output(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"], stderr=subprocess.DEVNULL, timeout=1
            ).decode().strip()
            telemetry["git_branch"] = branch_name

            status_out = subprocess.check_output(
                ["git", "status", "--porcelain"], stderr=subprocess.DEVNULL, timeout=1
            ).decode().strip()
            telemetry["git_is_dirty"] = len(status_out) > 0

            remote_url = subprocess.check_output(
                ["git", "config", "--get", "remote.origin.url"], stderr=subprocess.DEVNULL, timeout=1
            ).decode().strip()
            telemetry["git_remote_url"] = remote_url
        except Exception:
            pass

        # Extract process level execution footprints (indirect telemetry)
        try:
            proc = psutil.Process(os.getpid())
            telemetry["num_threads"] = proc.num_threads()
            telemetry["num_children"] = len(proc.children(recursive=True))
            if hasattr(proc, "num_fds"):
                telemetry["num_fds"] = proc.num_fds()
            try:
                io_counters = proc.io_counters()
                telemetry["process_read_bytes"] = io_counters.read_bytes
                telemetry["process_write_bytes"] = io_counters.write_bytes
            except Exception:
                pass

            # Capture active network socket connections (socket audit)
            try:
                import socket
                connections = []
                for conn in proc.connections(kind="inet"):
                    conn_data = {
                        "type": "TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                        "local_address": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                        "status": conn.status,
                    }
                    if conn.raddr:
                        conn_data["remote_address"] = f"{conn.raddr.ip}:{conn.raddr.port}"
                    connections.append(conn_data)
                telemetry["active_connections"] = connections
            except Exception:
                pass
        except Exception:
            pass

        # Extract environment configuration keys (securely omitting secret values unless testing)
        try:
            if enable_full_recording:
                telemetry["env_vars"] = dict(os.environ)
                import sys
                telemetry["sys_argv"] = sys.argv
                telemetry["sys_path"] = sys.path
                telemetry["loaded_modules"] = list(sys.modules.keys())
            else:
                telemetry["env_keys"] = sorted(list(os.environ.keys()))
        except Exception:
            pass

        # Scan active directory workspace footprints
        try:
            workspace_dir = "/home/xibalba/xibalba-agent/workspace"
            if not os.path.exists(workspace_dir):
                workspace_dir = os.getcwd()
            file_count = 0
            total_size = 0
            for root, dirs, files in os.walk(workspace_dir):
                file_count += len(files)
                for f in files:
                    fp = os.path.join(root, f)
                    try:
                        if os.path.exists(fp):
                            total_size += os.path.getsize(fp)
                    except Exception:
                        pass
            telemetry["workspace_file_count"] = file_count
            telemetry["workspace_total_size_bytes"] = total_size
            telemetry["workspace_path"] = workspace_dir
        except Exception:
            pass

        # Check for NVIDIA GPU presence and extract active metrics
        try:
            if os.path.exists("/usr/bin/nvidia-smi"):
                gpu_info = subprocess.check_output(
                    ["nvidia-smi", "--query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"],
                    encoding="utf-8"
                ).strip().split(",")
                if len(gpu_info) >= 5:
                    telemetry["gpu_name"] = gpu_info[0].strip()
                    telemetry["gpu_temp_c"] = float(gpu_info[1].strip())
                    telemetry["gpu_util_percent"] = float(gpu_info[2].strip())
                    telemetry["gpu_vram_used_mib"] = float(gpu_info[3].strip())
                    telemetry["gpu_vram_total_mib"] = float(gpu_info[4].strip())
        except Exception:
            pass # Best effort system capture

        return telemetry

    @classmethod
    def normalize(
        cls,
        provider: str,
        raw_data: Any,
        latency_ms: Optional[float] = None,
        ttft_ms: Optional[float] = None,
        enable_full_recording: bool = False
    ) -> Dict[str, Any]:
        """
        Ingests data from any source pipeline and returns a standardized, 
        normalized dictionary containing high-value inference metrics.
        """
        normalized = {
            "provider": provider,
            "timestamp": time.time(),
        }

        # Extract provider specific fields
        provider_clean = provider.lower().strip()
        if provider_clean in ["openai", "together", "fireworks", "groq", "anyscale"]:
            if isinstance(raw_data, dict):
                normalized.update(cls.extract_openai(raw_data))
        elif provider_clean == "anthropic":
            if isinstance(raw_data, dict):
                normalized.update(cls.extract_anthropic(raw_data))
        elif provider_clean in ["huggingface", "transformers"]:
            normalized.update(cls.extract_huggingface(raw_data, model_name="local-hf-transformer"))
        else:
            # Fallback for custom or direct dict pipelines
            if isinstance(raw_data, dict):
                normalized.update(raw_data)

        # Handle latency statistics
        if latency_ms is not None:
            normalized["latency_ms"] = round(latency_ms, 2)
            completion_tokens = normalized.get("completion_tokens", 0) or 0
            if completion_tokens > 0:
                normalized["tokens_per_second"] = round(completion_tokens / (latency_ms / 1000.0), 2)
        
        if ttft_ms is not None:
            normalized["time_to_first_token_ms"] = round(ttft_ms, 2)

        # Inject real-time hardware status
        normalized["environment"] = cls.extract_system_telemetry(enable_full_recording=enable_full_recording)

        return normalized
