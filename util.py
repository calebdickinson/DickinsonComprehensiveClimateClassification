# these maps can be used to decode or encode climate zone classifications
# on the left is the code and on the right is the name

cold_code = {
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

arid_code = {
    'H': 'Humid',
    'G': 'Semihumid',
    'W': 'Monsoon',
    'M': 'Mediterranean',
    'S': 'Semiarid',
    'D': 'Arid Desert'
}

warm_code = {
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
        arid = '0'      # not aridity value for this climate

    return [cold, arid, warm]

def decode(code:str):
    """Convert a climate zone code into a climate zone name

    Args:
        code (str): The climate zone code

    Returns:
        str: The climate zone name
    """

    [cold, arid, warm] = breakup(code)  # get cold, arid, and warm values
    if arid is '0': # get name without aridity
        return cold_code[cold] + " " + warm_code[warm]
    else:           # get name with aridity
        return cold_code[cold] + " " + arid_code[arid] + " " + warm_code[warm]
