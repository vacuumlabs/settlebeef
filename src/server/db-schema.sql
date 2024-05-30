CREATE TABLE user_details (
    x_handle VARCHAR(255) NOT NULL,
    temporary_private_key VARCHAR(255),
    smart_account_address VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    PRIMARY KEY (x_handle)
)