from integrity_sdk.evals import TrajectoryEvaluator
import pytest

def test_evals(mocker):
    client = mocker.MagicMock()
    client.commit_action_intent.return_value = "commitment_id"
    client.validate_and_execute.return_value = "validated"
    
    evaluator = TrajectoryEvaluator(client, "test_policy")
    evaluator.capture_tool_call("tool1", {"a": 1}, "res")
    evaluator.capture_file_mutation("file.txt", "write", "diff")
    
    def success_func():
        evaluator.capture_tool_call("tool2", {}, "res")
        return "done"
    
    res = evaluator.run_with_intent({"state": "test"}, "action", success_func)
    assert res == "validated"
    
    def fail_func():
        raise ValueError("error")
    
    with pytest.raises(ValueError):
        evaluator.run_with_intent({"state": "test"}, "action", fail_func)
