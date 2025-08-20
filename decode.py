# these maps can be used to decode or encode climate zone classifications
# on the left is the code and on the right is the name

codes = {
    'ZDX',
    'ZSZ2',
    'ZDZ2',
    'ZHZ1',
    'ZGZ1',
    'ZWZ1',
    'ZSZ1',
    'ZDZ1',
    'AWX',
    'ADX',
    'AWZ2',
    'AMZ2',
    'ADZ2',
    'AHZ1',
    'AGZ1',
    'AWZ1',
    'AMZ1',
    'ASZ1',
    'ADZ1',
    'AHA2',
    'AGA2',
    'AWA2',
    'AMA2',
    'ASA2',
    'ADA2',
    'AHA1',
    'AGA1',
    'AWA1',
    'ASA1',
    'ADA1',
    'BDX',
    'BGZ2',
    'BWZ2',
    'BSZ2',
    'BDZ2',
    'BHZ1',
    'BGZ1',
    'BWZ1',
    'BMZ1',
    'BSZ1',
    'BDZ1',
    'BHA2',
    'BGA2',
    'BWA2',
    'BMA2',
    'BSA2',
    'BDA2',
    'BHA1',
    'BGA1',
    'BWA1',
    'BMA1',
    'BSA1',
    'BDA1',
    'BHB2',
    'BGB2',
    'BWB2',
    'BMB2',
    'BSB2',
    'BDB2',
    'BB1',
    'CGZ2',
    'CDZ2',
    'CHZ1',
    'CGZ1',
    'CWZ1',
    'CMZ1',
    'CSZ1',
    'CDZ1',
    'CHA2',
    'CGA2',
    'CWA2',
    'CMA2',
    'CSA2',
    'CDA2',
    'CHA1',
    'CGA1',
    'CWA1',
    'CMA1',
    'CSA1',
    'CDA1',
    'CHB2',
    'CGB2',
    'CWB2',
    'CMB2',
    'CSB2',
    'CDB2',
    'CB1',
    'CC2',
    'CC1',
    'DWZ1',
    'DSZ1',
    'DDZ1',
    'DHA2',
    'DGA2',
    'DWA2',
    'DMA2',
    'DSA2',
    'DDA2',
    'DHA1',
    'DGA1',
    'DWA1',
    'DMA1',
    'DSA1',
    'DDA1',
    'DHB2',
    'DGB2',
    'DWB2',
    'DMB2',
    'DSB2',
    'DDB2',
    'DB1',
    'DC2',
    'DC1',
    'DY',
    'EWA2',
    'ESA2',
    'EDA2',
    'EHA1',
    'EGA1',
    'EWA1',
    'ESA1',
    'EDA1',
    'EHB2',
    'EGB2',
    'EMB2',
    'EWB2',
    'ESB2',
    'EDB2',
    'EB1',
    'EC2',
    'EC1',
    'EY',
    'FA2',
    'FA1',
    'FB2',
    'FB1',
    'FC2',
    'FC1',
    'FY',
    'GA1',
    'GB2',
    'GB1',
    'GC2',
    'GC1',
    'GY',
    'YB2',
    'YB1',
    'YC2',
    'YC1',
    'YY'
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

# these lists give a way to iterate through the temperature changes
cold_ordered = list(cold_codes.keys())
arid_ordered = list(arid_codes.keys())
warm_ordered = list(warm_codes.keys())

def traverse_climates(code:str, type:str, direction:int) -> str:
    """Traverse the climate zones in the specified direction.

    Args:
        code (str): The current climate zone code
        type (str): The type of climate zone ('cold', 'arid', 'warm')
        direction (int): The direction to traverse (1 for forward, -1 for backward)
        Also gives magnitude to traverse. Current website implementation
        will only use magnitude 1.

    Returns:
        str: The climate zone found after the specified step from the input one
    """

    if type not in ['cold', 'arid', 'warm']:
        raise ValueError("Invalid climate type")
    
    if direction not in [1, -1]:
        raise ValueError("Invalid direction")

    if type == 'cold':
        ordered = cold_ordered
    elif type == 'arid':
        ordered = arid_ordered
    else: #  type == 'warm'
        ordered = warm_ordered

    

    current_index = ordered.index(code)
    new_index = current_index + direction

    # Wrap around if out of bounds
    if new_index < 0:
        new_index = len(ordered) - 1
    elif new_index >= len(ordered):
        new_index = 0

    return ordered[new_index]

# functions
def breakup(code:str):
    """ Get cold, arid, and warm values from code

    Args:
        code (str): The complete code for a climate

    Returns:
        list[str]: Separated cold, arid, and warm values. 
        Arid=0 means there is no arid value for this climate
    """

    # there is always a cold and always a warm
    # if cold is F or colder, there is no aridity
    # if warm is B1 or colder, there is no aridity
    cold = code[0]
    if code[-1].isdigit():  # if last digit is a number then warm is a two digit code
        warm = code[-2:]
    else:                   # otherwise warm is a single digit
        warm = code[-1]

    if cold not in [ 'F', 'G', 'Y'] and warm not in ['B1', 'C2', 'C1', 'Y']:
        arid = code[1]  # aridity exists
    else:
        arid = ''      # no aridity value for this climate

    return [cold, arid, warm]

def decode(code:str):
    """Convert a climate zone code into a climate zone name

    Args:
        code (str): The climate zone code

    Returns:
        str: The climate zone name
    """

    [cold, arid, warm] = breakup(code)  # get cold, arid, and warm values
    return cold_codes[cold] + " " + arid_codes[arid] + " " + warm_codes[warm] # arid may be ""

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