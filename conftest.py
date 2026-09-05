import sys
import os
import asyncio
import pytest

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from scripts.seed_db import seed


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Guarantees that database schemas and default assets/users are initialized
    prior to any test execution, across local and CI/CD runner environments.
    """
    asyncio.run(seed())
