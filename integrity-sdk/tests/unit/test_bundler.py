import pytest
from integrity_sdk.bundler import IntegrityBundler

def test_bundler_init():
    """Verify bundler initialization."""
    bundler = IntegrityBundler(
        entry_point="0x123",
        paymaster_url="http://localhost:8000",
        bundler_url="http://localhost:9000"
    )
    assert bundler.entry_point == "0x123"
    assert bundler.paymaster_url == "http://localhost:8000"
    assert bundler.bundler_url == "http://localhost:9000"
