from integrity_sdk.universal import Integrity

def test_universal(mocker):
    client = mocker.MagicMock()
    mocker.patch("integrity_sdk.universal.IntegrityClient", return_value=client)
    res = Integrity.init(agent_id="test")
    assert res == client
    assert Integrity.get_client() == client
    
    Integrity.log({"test": 1})
    client.log_telemetry.assert_called_with({"test": 1})
    
    Integrity.register()
    client.register_agent.assert_called_once()
    
    Integrity.handshake()
    client.handshake.assert_called_once()
    
    class Dummy:
        pass
    obj = Dummy()
    assert Integrity.wrap(obj) == obj
