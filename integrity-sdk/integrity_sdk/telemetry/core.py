import os
from typing import Optional
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

def init_telemetry(
    agent_id: str,
    endpoint: str = "localhost:4317",
    insecure: bool = True
) -> None:
    """
    Initializes the OpenTelemetry SDK with OTLP/gRPC exporters.
    Configures standard resource attributes for the Integrity Protocol.
    """
    resource = Resource.create({
        "service.name": "integrity-agent",
        "service.version": "0.2.0",
        "integrity.agent.id": agent_id,
    })

    # 1. Setup Tracer
    tracer_provider = TracerProvider(resource=resource)
    trace_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=insecure)
    span_processor = BatchSpanProcessor(trace_exporter)
    tracer_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(tracer_provider)

    # 2. Setup Meter
    metric_exporter = OTLPMetricExporter(endpoint=endpoint, insecure=insecure)
    reader = PeriodicExportingMetricReader(metric_exporter, export_interval_millis=5000)
    meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(meter_provider)

def get_tracer(name: str = "integrity_sdk"):
    return trace.get_tracer(name)

def get_meter(name: str = "integrity_sdk"):
    return metrics.get_meter(name)
