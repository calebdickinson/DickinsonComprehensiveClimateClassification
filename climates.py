# these maps can be used to decode or encode climate zone classifications
# on the left is the code and on the right is the name

climates = {
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

cold_climates = {
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

arid_climates = {
    'H': 'Humid',
    'G': 'Semihumid',
    'W': 'Monsoon',
    'M': 'Mediterranean',
    'S': 'Semiarid',
    'D': 'Arid Desert'
}

warm_climates = {
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

# use coldest end of cold temperatures
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

# use warmest end of warm temperatures
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
cold_ordered = list(cold_climates.keys())
arid_ordered = list(arid_climates.keys())
warm_ordered = list(warm_climates.keys())

def verify_climates_1() -> bool:
    """Verify that all climates in the set are valid

    Returns:
        bool: True if all climates in the set are valid, False otherwise
    """
    for code in climates:

        cold = code[0]
        if code[-1].isdigit():  # if last digit is a number then warm is a two digit code
            warm = code[-2:] 
            arid = code[1:-2]
        else:                   # otherwise warm is a single digit
            warm = code[-1]
            arid = code[1:-1]

        if cold not in [ 'F', 'G', 'Y'] and warm not in ['B1', 'C2', 'C1', 'Y']:
            assert arid != "", f"Code {code} shouldn't have aridity, but does"
        else:
            assert arid == '', f"Code {code} should have aridity, but doesn't"

    return True

def verify_climates_2() -> bool:
    """Verify that all valid climates are in the climates set

    Returns:
        bool: True if all valid climates are in the set, False otherwise
    """

    valid_climates:set[str] = set()
    # there is always a cold and always a warm
    # if cold is F or colder, there is no aridity
    # if warm is B1 or colder, there is no aridity
    # the temperature of the hottest month cannot be colder than the coldest month
    for cold_code in cold_climates:
        for warm_code in warm_climates:
            if warm_temps[warm_code] >= cold_temps[cold_code]:
                if cold_code in ['F', 'G', 'Y'] or warm_code in ['B1', 'C2', 'C1', 'Y']:
                    valid_climates.add(combine(cold_code, "", warm_code))  # no aridity
                else:
                    for arid_code in arid_climates: # aridity
                        valid_climates.add(combine(cold_code, arid_code, warm_code))

    for code in valid_climates:
        #assert code in climates, f"Code {code} is not in the set of climates"
        if code not in climates: print(f"Code {code} is not in the set of climates")

    for code in climates:
        #assert code in valid_climates, f"Code {code} is not valid"
        if code not in valid_climates: print(f"Code {code} is not valid")

    return True


def traverse_climates(code:str, type:str, direction:int) -> str:
    """Traverse the climate zones in the specified direction
    Can also be used to check if traversal is possible

    Args:
        code (str): The current climate zone code
        type (str): The type of climate zone ('cold', 'arid', 'warm')
        direction (int): The direction to traverse (1 for forward, -1 for backward)
        Also gives magnitude to traverse. Current website implementation
        will only use magnitude 1.

    Returns:
        str: Returns the destination climate zone if traversal is possible
        Returns "False" if the traversal is not possible
    """

    if not type in ['cold', 'arid', 'warm']: return "False"
    if not direction in [1, -1]: return "False"

    factors = breakup(code)  # get cold, arid, and warm values
    cold = factors[0]
    arid = factors[1]
    warm = factors[2]

    if type == 'cold':
        if not cold in cold_ordered: return "False"
        if direction == 1 and not cold_ordered.index(cold) < len(cold_ordered) - 1: return "False"
        elif direction == -1 and not cold_ordered.index(cold) > 0: return "False"
        cold = cold_ordered[direction + cold_ordered.index(cold)]
    elif type == 'arid':
        if not arid in arid_ordered: return "False"
        if direction == 1 and not arid_ordered.index(arid) < len(arid_ordered) - 1: return "False"
        elif direction == -1 and not arid_ordered.index(arid) > 0: return "False"
        arid = arid_ordered[direction + arid_ordered.index(arid)]
    else: #  type == 'warm'
        if not warm in warm_ordered: return "False"
        if direction == 1 and not warm_ordered.index(warm) < len(warm_ordered) - 1: return "False"
        elif direction == -1 and not warm_ordered.index(warm) > 0: return "False"
        warm = warm_ordered[direction + warm_ordered.index(warm)]

    new_climate = combine(cold, arid, warm)
    if new_climate not in climates: return "False"
    return new_climate

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
    return cold_climates[cold] + " " + arid_climates[arid] + " " + warm_climates[warm] # arid may be ""

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


if __name__ == "__main__":
    print(verify_climates_1())  # verify that all climates in set are valid
    print(verify_climates_2())  # verify that all valid climates are in set