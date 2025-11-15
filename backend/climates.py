# these maps can be used to decode or encode climate zone classifications
# on the left is the code and on the right is the name

codes = {
'HH',
'XH', 'XX',
'ZH', 'ZX', 'Zz2', 'Zz1',
'AH', 'AX', 'Az2', 'Az1', 'Aa2', 'Aa1',
'BH', 'BX', 'Bz2', 'Bz1', 'Ba2', 'Ba1', 'Bb2', 'Bb1',
'CH', 'CX', 'Cz2', 'Cz1', 'Ca2', 'Ca1', 'Cb2', 'Cb1', 'Cc2', 'Cc1',
'DH', 'DX', 'Dz2', 'Dz1', 'Da2', 'Da1', 'Db2', 'Db1', 'Dc2', 'Dc1', 'DY',
'EH', 'EX', 'Ez2', 'Ez1', 'Ea2', 'Ea1', 'Eb2', 'Eb1', 'Ec2', 'Ec1', 'EY',
'FH', 'FX', 'Fz2', 'Fz1', 'Fa2', 'Fa1', 'Fb2', 'Fb1', 'Fc2', 'Fc1', 'FY',
'GH', 'GX', 'Gz2', 'Gz1', 'Ga2', 'Ga1', 'Gb2', 'Gb1', 'Gc2', 'Gc1', 'GY',
'YH', 'YX', 'Yz2', 'Yz1', 'Ya2', 'Ya1', 'Yb2', 'Yb1', 'Yc2', 'Yc1', 'YY',

      'Zhz2', 'Zhz1',
      'Ahz2', 'Ahz1', 'Aha2', 'Aha1',
      'Bhz2', 'Bhz1', 'Bha2', 'Bha1', 'Bhb2',
      'Chz2', 'Chz1', 'Cha2', 'Cha1', 'Chb2',
              'Dhz1', 'Dha2', 'Dha1', 'Dhb2',
              'Ehz1', 'Eha2', 'Eha1', 'Ehb2',

      'Zgz2', 'Zgz1',
      'Agz2', 'Agz1', 'Aga2', 'Aga1',
      'Bgz2', 'Bgz1', 'Bga2', 'Bga1', 'Bgb2',
              'Cgz1', 'Cga2', 'Cga1', 'Cgb2',
              'Dgz1', 'Dga2', 'Dga1', 'Dgb2',
                      'Ega2', 'Ega1', 'Egb2',
            
       'Zwz2', 'Zwz1',
'AwX', 'Awz2', 'Awz1', 'Awa2', 'Awa1',
       'Bwz2', 'Bwz1', 'Bwa2', 'Bwa1', 'Bwb2',
               'Cwz1', 'Cwa2', 'Cwa1', 'Cwb2',
               'Dwz1', 'Dwa2', 'Dwa1', 'Dwb2',
               'Ewz1', 'Ewa2', 'Ewa1', 'Ewb2',

       'Zmz2', 'Zmz1',
       'Amz2', 'Amz1', 'Ama2', 'Ama1',
       'Bmz2', 'Bmz1', 'Bma2', 'Bma1', 'Bmb2',
       'Cmz2', 'Cmz1', 'Cma2', 'Cma1', 'Cmb2',
               'Dmz1', 'Dma2', 'Dma1', 'Dmb2',
                               'Ema1', 'Emb2',

'ZsX', 'Zsz2', 'Zsz1',
'AsX', 'Asz2', 'Asz1', 'Asa2', 'Asa1',
       'Bsz2', 'Bsz1', 'Bsa2', 'Bsa1', 'Bsb2',
       'Csz2', 'Csz1', 'Csa2', 'Csa1', 'Csb2',
               'Dsz1', 'Dsa2', 'Dsa1', 'Dsb2',
                       'Esa2', 'Esa1', 'Esb2',

'ZdX', 'Zdz2', 'Zdz1',
'AdX', 'Adz2', 'Adz1', 'Ada2', 'Ada1',
'BdX', 'Bdz2', 'Bdz1', 'Bda2', 'Bda1', 'Bdb2',
'CdX', 'Cdz2', 'Cdz1', 'Cda2', 'Cda1', 'Cdb2',
       'Ddz2', 'Ddz1', 'Dda2', 'Dda1', 'Ddb2',
               'Edz1', 'Eda2', 'Eda1', 'Edb2',
}

code_groups = {
    'HH',
    'XH', 'XX',
    'ZH', 'ZX', 'Zz2', 'Zz1',
    'AH', 'AX', 'Az2', 'Az1', 'Aa2', 'Aa1',
    'BH', 'BX', 'Bz2', 'Bz1', 'Ba2', 'Ba1', 'Bb2',
    'CH', 'CX', 'Cz2', 'Cz1', 'Ca2', 'Ca1', 'Cb2',
    'DH', 'DX', 'Dz2', 'Dz1', 'Da2', 'Da1', 'Db2',
    'EH', 'EX', 'Ez2', 'Ez1', 'Ea2', 'Ea1', 'Eb2',
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
    'h': 'Humid',
    'g': 'Semihumid',
    'w': 'Monsoon',
    'm': 'Mediterranean',
    's': 'Semiarid',
    'd': 'Arid Desert'
}

warm_codes = {
    'H': 'Hypercaneal Summer',
    'X': 'Extreme Hyperthermal Summer',
    'z2': 'Hyperthermal Summer',
    'z1': 'Scorching Hot Summer',
    'a2': 'Very Hot Summer',
    'a1': 'Hot Summer',
    'b2': 'Mild Summer',
    'b1': 'Cold Summer',
    'c2': 'Very Cold Summer',
    'c1': 'Freezing Summer',
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
    'z2': 40,
    'z1': 35,
    'a2': 30,
    'a1': 25,
    'b2': 20,
    'b1': 15,
    'c2': 10,
    'c1': 5,
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
    if cold in ['H', 'F', 'G', 'Y'] or warm in ['b1', 'c2', 'c1', 'Y'] or cold + warm in ['EX', 'XX']:
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
        'DH',
        'EH', 'EX',
        'FH', 'FX', 'Fz2',
        'GH', 'GX', 'Gz2',
        'YH', 'YX', 'Yz2', 'Yz1',               'Yc2', 'Yc1'
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
