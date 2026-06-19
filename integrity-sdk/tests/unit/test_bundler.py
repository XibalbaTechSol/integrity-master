from integrity_sdk.bundler import IntegrityBundler
import pytest

def test_bundler(requests_mock, mocker):
    bundler = IntegrityBundler("0xep", "http://pm", "http://bun", 1)
    mocker.patch("eth_account.Account.sign_message", return_value=mocker.MagicMock(signature=b'sig'))
    
    requests_mock.post("http://pm", json={"paymaster_and_data": "0xpm"})
    requests_mock.post("http://bun", json={"result": "0xres"})
    res = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res == "0xres"

    requests_mock.post("http://pm", status_code=500)
    requests_mock.post("http://bun", json={"error": "err"})
    res2 = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res2 == "0x_SUBMISSION_FAILED"

    requests_mock.post("http://bun", exc=Exception("network"))
    res3 = bundler.submit_user_op("0xsender", "0xcall", "0xkey")
    assert res3 == "0x_SUBMISSION_FAILED"
