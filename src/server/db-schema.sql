CREATE TABLE user_details (
    x_handle VARCHAR(255),
    email VARCHAR(255),
    farcaster_id VARCHAR(255),
    temporary_private_key VARCHAR(255),
    smart_account_address VARCHAR(255) NOT NULL,
    owner VARCHAR(255),
    chain_id INTEGER NOT NULL;
    PRIMARY KEY (smart_account_address)
)