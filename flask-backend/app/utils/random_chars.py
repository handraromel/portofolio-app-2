import random
import string

# Word lists for memorable password generation
NOUNS = ['House', 'Village', 'Castle', 'Garden', 'Forest',
         'River', 'Mountain', 'Ocean', 'Desert', 'Island']
VERBS = ['Leave', 'Enter', 'Build', 'Create', 'Watch',
         'Listen', 'Dance', 'Sing', 'Write', 'Read']
ADJECTIVES = ['Happy', 'Brave', 'Quiet', 'Bright',
              'Dark', 'Swift', 'Calm', 'Wild', 'Wise', 'Kind']
SPECIAL_CHARS = '@#$%&*'


def generate_random_password(min_length=8, max_length=20):
    """
    Generate a memorable password that meets the following criteria:
    - Between 8-20 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one number
    - Contains one special character

    Returns a string like: 'LeaveForest@123' or 'HappyMountain#42'
    """
    # Select random words for the base
    word1 = random.choice(VERBS + ADJECTIVES)
    word2 = random.choice(NOUNS)

    # Add special character and number
    special_char = random.choice(SPECIAL_CHARS)
    number = str(random.randint(1, 999))

    # Combine parts
    password = f"{word1}{word2}{special_char}{number}"

    # Ensure length constraints
    if len(password) > max_length:
        # Trim the number part if too long
        excess = len(password) - max_length
        number = str(random.randint(1, 99))  # Use smaller number
        password = f"{word1}{word2}{special_char}{number}"

    # Validate password meets all requirements
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in SPECIAL_CHARS for c in password)

    # Add any missing requirements
    if not has_upper:
        password = random.choice(string.ascii_uppercase) + password
    if not has_lower:
        password = password + random.choice(string.ascii_lowercase)
    if not has_digit and not any(c.isdigit() for c in password):
        password = password + str(random.randint(0, 9))
    if not has_special:
        password = password + random.choice(SPECIAL_CHARS)

    # Final length check
    if len(password) < min_length:
        padding = ''.join(random.choices(string.ascii_letters + string.digits,
                                         k=min_length - len(password)))
        password = password + padding

    return password
