import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import data_import

def test_validate_input():  
    assert data_import.validate_input('Kościół św. Elżbiety', ['kościoł', 'najświędsza']) is None

def test_validate_input_capitalized():  
    assert data_import.validate_input('Kościoł Św. Józefa', ['Kościoł', 'kosciół']) is True

def test_validate_input_capitalized_value():  
    assert data_import.validate_input('kościoł Św. Józefa', ['Kościoł', 'kosciół'], ['Kościoła']) is True

def test_validate_input_excluded():  
    assert data_import.validate_input('Kaplica Ojców kościoła', ['kościoł'], ['kościoła']) is None

def test_validate_input_sensitivity():  
    assert data_import.validate_input('Kościół jezusa', ['jezus'], ignore_sensivity = False) is True

def test_validate_input_ignore_sensitivity():  
    assert data_import.validate_input('Kościół Jezusa', ['jezus'], ignore_sensivity = False) is None

def test_validate_input_ignore_sensitivity_filter():  
    assert data_import.validate_input('Kościół jezusa', ['Jezus'], ignore_sensivity = False) is None

def test_validate_input_ignore_sensitivity_excluded():  
    assert data_import.validate_input('Kościół jezusowy', ['jezus'], ['jezusowy'], ignore_sensivity=False) is None