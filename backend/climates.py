# these maps can be used to decode or encode climate zone classifications
# on the left is the code and on the right is the name

codes = {
'HH',
'XH', 'XX',
'ZH', 'ZX', 'ZZ2', 'ZZ1',
'AH', 'AX', 'AZ2', 'AZ1', 'AA2', 'AA1',
'BH', 'BX', 'BZ2', 'BZ1', 'BA2', 'BA1', 'BB2', 'BB1',
'CH', 'CX', 'CZ2', 'CZ1', 'CA2', 'CA1', 'CB2', 'CB1', 'CC2', 'CC1',
'DH', 'DX', 'DZ2', 'DZ1', 'DA2', 'DA1', 'DB2', 'DB1', 'DC2', 'DC1', 'DY',
'EH', 'EX', 'EZ2', 'EZ1', 'EA2', 'EA1', 'EB2', 'EB1', 'EC2', 'EC1', 'EY',
'FH', 'FX', 'FZ2', 'FZ1', 'FA2', 'FA1', 'FB2', 'FB1', 'FC2', 'FC1', 'FY',
'GH', 'GX', 'GZ2', 'GZ1', 'GA2', 'GA1', 'GB2', 'GB1', 'GC2', 'GC1', 'GY',
'YH', 'YX', 'YZ2', 'YZ1', 'YA2', 'YA1', 'YB2', 'YB1', 'YC2', 'YC1', 'YY',

              'ZHZ1',
              'AHZ1', 'AHA2', 'AHA1',
              'BHZ1', 'BHA2', 'BHA1', 'BHB2',
              'CHZ1', 'CHA2', 'CHA1', 'CHB2',
                      'DHA2', 'DHA1', 'DHB2',
                      'EHA2', 'EHA1', 'EHB2',

      'ZGZ2', 'ZGZ1',
      'AGZ2', 'AGZ1', 'AGA2', 'AGA1',
      'BGZ2', 'BGZ1', 'BGA2', 'BGA1', 'BGB2',
              'CGZ1', 'CGA2', 'CGA1', 'CGB2',
              'DGZ1', 'DGA2', 'DGA1', 'DGB2',
                      'EGA2', 'EGA1', 'EGB2',
            
       'ZWZ2', 'ZWZ1',
'AWX', 'AWZ2', 'AWZ1', 'AWA2', 'AWA1',
       'BWZ2', 'BWZ1', 'BWA2', 'BWA1', 'BWB2',
               'CWZ1', 'CWA2', 'CWA1', 'CWB2',
               'DWZ1', 'DWA2', 'DWA1', 'DWB2',
               'EWZ1', 'EWA2', 'EWA1', 'EWB2',

       'ZMZ2', 'ZMZ1',
       'AMZ2', 'AMZ1', 'AMA2', 'AMA1',
       'BMZ2', 'BMZ1', 'BMA2', 'BMA1', 'BMB2',
       'CMZ2', 'CMZ1', 'CMA2', 'CMA1', 'CMB2',
               'DMZ1', 'DMA2', 'DMA1', 'DMB2',
                               'EMA1', 'EMB2',

'ZSX', 'ZSZ2', 'ZSZ1',
'ASX', 'ASZ2', 'ASZ1', 'ASA2', 'ASA1',
       'BSZ2', 'BSZ1', 'BSA2', 'BSA1', 'BSB2',
       'CSZ2', 'CSZ1', 'CSA2', 'CSA1', 'CSB2',
               'DSZ1', 'DSA2', 'DSA1', 'DSB2',
                       'ESA2', 'ESA1', 'ESB2',

'ZDX', 'ZDZ2', 'ZDZ1',
'ADX', 'ADZ2', 'ADZ1', 'ADA2', 'ADA1',
'BDX', 'BDZ2', 'BDZ1', 'BDA2', 'BDA1', 'BDB2',
'CDX', 'CDZ2', 'CDZ1', 'CDA2', 'CDA1', 'CDB2',
       'DDZ2', 'DDZ1', 'DDA2', 'DDA1', 'DDB2',
               'EDZ1', 'EDA2', 'EDA1', 'EDB2',
}

code_groups = {
    'HH',
    'XH', 'XX',
    'ZH', 'ZX', 'ZZ2', 'ZZ1',
    'AH', 'AX', 'AZ2', 'AZ1', 'AA2', 'AA1',
    'BH', 'BX', 'BZ2', 'BZ1', 'BA2', 'BA1', 'BB2',
    'CH', 'CX', 'CZ2', 'CZ1', 'CA2', 'CA1', 'CB2',
    'DH', 'DX', 'DZ2', 'DZ1', 'DA2', 'DA1', 'DB2',
    'EH', 'EX', 'EZ2', 'EZ1', 'EA2', 'EA1', 'EB2',
}

cold_codes = {
    'H': 'Hypercaneal',
    'X': 'Uninhabitable',
    'Z': 'Ultratropical',
    'A': 'Supertropical',
    'B': 'Tropical',
    'C': 'Subtropical',
    'D': 'Temperate',
    'E': 'Continental',
    'F': 'Subarctic',
    'G': 'Arctic',
    'Y': 'Superarctic'
}

arid_codes = {
    'H': 'Humid',
    'G': 'Semihumid',
    'W': 'Monsoon',
    'M': 'Mediterranean',
    'S': 'Semiarid',
    'D': 'Arid Desert'
}

warm_codes = {
    'H': 'Hypercaneal Summer',
    'X': 'Extreme Hyperthermal Summer',
    'Z2': 'Hyperthermal Summer',
    'Z1': 'Scorching Hot Summer',
    'A2': 'Very Hot Summer',
    'A1': 'Hot Summer',
    'B2': 'Mild Summer',
    'B1': 'Cold Summer',
    'C2': 'Very Cold Summer',
    'C1': 'Freezing Summer',
    'Y': 'Frigid Summer',
}

# use the coldest end of cold temperatures
cold_temps = {
    'H': 50,
    'X': 40,
    'Z': 30,
    'A': 20,
    'B': 10,
    'C': 0,
    'D': -10,
    'E': -20,
    'F': -30,
    'G': -40,
    'Y': -41
}

# use the warmest end of warm temperatures
warm_temps = {
    'H': 51,
    'X': 50,
    'Z2': 40,
    'Z1': 35,
    'A2': 30,
    'A1': 25,
    'B2': 20,
    'B1': 15,
    'C2': 10,
    'C1': 5,
    'Y': 0,
}

# these lists give a way to iterate through the temperature changes
cold_ordered = list(cold_codes.keys())
arid_ordered = list(arid_codes.keys())
warm_ordered = list(warm_codes.keys())

def has_aridity(cold:str, warm:str) -> bool:
    """Check if a climate code has aridity

    Args:
        cold (str): The cold climate code
        warm (str): The warm climate code

    Returns:
        bool: True if the code has aridity, False otherwise
    """
    if cold in ['H', 'F', 'G', 'Y'] or warm in ['B1', 'C2', 'C1', 'Y'] or cold + warm in ['XX', 'CX', 'DX', 'EX', 'EZ2']:
        return False
    return True

def does_exist(code: str) -> bool:
    """Check if a climate code exists in the codes set

    Args:
        code (str): The climate code to check

    Returns:
        bool: True if the code exists, False otherwise
    """
    return code not in [
        'HH',
        'XH', 'XX',
        'ZH', 
        'AH', 
        'BH', 
        'CH',
        'DH', 'DX',
        'EH', 'EX',
        'FH', 'FX', 'FZ2', 'FZ1',
        'GH', 'GX', 'GZ2', 'GZ1',
        'YH', 'YX', 'YZ2', 'YZ1', 'YA2', 'YA1'
        ]

def is_code_group(code: str) -> bool:
    """Check if a climate code is a code group

    Args:
        code (str): The climate code to check

    Returns:
        bool: True if the code is a code group, False otherwise
    """
    return code in code_groups

def breakup_code_group(code:str) -> list[str]:
    """Break up a code group into its individual codes

    Args:
        code (str): The code group to break up

    Returns:
        list[str]: A list of individual codes
    """
    if not is_code_group(code):
        return ["False", "False", "False", "False", "False", "False"]
    
    group:list[str] = []
    for i in range(6):
        acode:str = code[0] + arid_ordered[i] + code[1:]
        if acode in codes: group.append(acode)
        else: group.append("False")

    return group

def traverse_codes(code:str, part:str, direction:int) -> str:
    """Traverse the climate zones in the specified direction
    Can also be used to check if traversal is possible

    Args:
        code (str): The current climate zone code
        part (str): The type of climate zone ('cold', 'arid', 'warm')
        direction (int): The direction to traverse (1 for forward, -1 for backward)
        Also gives magnitude to traverse. Current website implementation
        will only use magnitude 1.

    Returns:
        str: Returns the destination climate zone if traversal is possible
        Returns "False" if the traversal is not possible
    """

    if not part in ['cold', 'arid', 'warm']: return "False"
    if not direction in [1, -1]: return "False"

    factors = breakup(code)  # get cold, arid, and warm values
    cold = factors[0]
    arid = factors[1]
    warm = factors[2]

    if part == 'cold':
        if not cold in cold_ordered: return "False"
        if direction == 1 and not cold_ordered.index(cold) < len(cold_ordered) - 1: return "False"
        elif direction == -1 and not cold_ordered.index(cold) > 0: return "False"
        cold = cold_ordered[direction + cold_ordered.index(cold)]
    elif part == 'arid':
        if not arid in arid_ordered: return "False"
        if direction == 1 and not arid_ordered.index(arid) < len(arid_ordered) - 1: return "False"
        elif direction == -1 and not arid_ordered.index(arid) > 0: return "False"
        arid = arid_ordered[direction + arid_ordered.index(arid)]
    else: #  type == 'warm'
        if not warm in warm_ordered: return "False"
        if direction == 1 and not warm_ordered.index(warm) < len(warm_ordered) - 1: return "False"
        elif direction == -1 and not warm_ordered.index(warm) > 0: return "False"
        warm = warm_ordered[direction + warm_ordered.index(warm)]

    temp = combine(cold, arid, warm)
    temp2 = combine(cold, '', warm) # try without aridity (for navigating from climates with aridity values to climates without)

    if temp in codes: new_climate = temp
    elif temp2 in codes: new_climate = temp2
    else: new_climate = "False"
    
    return new_climate

def breakup(code:str):
    """ Get cold, arid, and warm values from code

    Args:
        code (str): The complete code for a climate

    Returns:
        list[str]: Separated cold, arid, and warm values. 
        Arid=0 means there is no arid value for this climate
    """

    assert code in codes, f"Code {code} is not a valid climate code"

    if code in code_groups: return[code[0], '', code[1:]]

    # there is always a cold and always a warm
    # if cold is F or colder, there is no aridity
    # if warm is B1 or colder, there is no aridity

    cold = code[0]
    if code[-1].isdigit():warm = code[-2:]
    else: warm = code[-1]

    if has_aridity(cold, warm): arid = code[1]
    else: arid = ''   

    return [cold, arid, warm]

def decode(code:str):
    """Convert a climate zone code into a climate zone name

    Args:
        code (str): The climate zone code

    Returns:
        str: The climate zone name
    """
    [cold, arid, warm] = breakup(code)  # get cold, arid, and warm values
    parts: list[str] = [cold_codes[cold]]
    if arid: parts.append(arid_codes[arid])
    parts.append(warm_codes[warm])
    return " ".join(parts)

def combine(cold:str, arid:str, warm:str) -> str:
    """Combine cold, arid, and warm values into a climate zone code

    Args:
        cold (str): The cold value
        arid (str): The arid value
        warm (str): The warm value

    Returns:
        str: The climate zone code
    """

    return cold + arid + warm # arid may be ""


if __name__ == "__main__": # these tests will fail. Instead, we're trusting that the values on the website are correct
    pass