# Toco - Example Issuing Microservice

Toco enables truly global commerce using [DigitalBits](https://digitalbits.io/) technology. The ecosystem enables merchants to easily issue and distribute store credit, and enables customers to store, exchange, and redeem this store value.

Toco places an emphasis on usability. We do not expect our end-users to have any knowledge of blockchain or the underlying technology. Features should "just work" at the tap of a button.

This is a Next.js bootstrapped service that demonstrates the ability for merchants to create 
their own unique tokens to represent store value.

It is meant to be a simple demo of the DigitalBits network workflow outlined in the Toco
[whitepaper](https://bafybeic32qpjarhqtoy5kwzqifjd6fj46qzbakf5nnlwarai5ogdgs53ci.ipfs.dweb.link/Toco%20-%20Whitepaper.pdf).


## Getting Started

Getting started with the repo is as easy as installing all dependencies using `yarn` or `npm` and running the
`dev` script. This will spawn a Next.js app at `localhost:3000`

## The Service

For demo purposes, this service has **no** authentication. In production, this could potentially be an isolated service
within a service mesh that is responsible only for interacting with the DigitalBits blockchain.

We use a local JSON file as a "database". In production, we can leverage Postgres (instead of a 
noSQL JSON document store) + Prisma ORM. We currently define the global schema as:


```typescript
// An account for Digitalbits
interface DigitalBitsAccount {
  publicKey: string,
  secretKey: string
}


// A created token
interface DigitalBitsToken {
  code: string;
  name: string;
}

// A user in the database
type DatabaseUser = {
  id: string;
  digitalBitsAccount: DigitalBitsAccount;
};

// Global Database Schema
type DatabaseSchema = {
  globals: {
    // Issuing account for ALL assets under Toco
    issuingAccount: DigitalBitsAccount;
  };
  // A user can be a merchant or a customer - to the Digitalbits blockchain, there is no difference
  users: Record<string, DatabaseUser>;
  // A mapping of the token asset code to the token metadata
  // Also holds the ID of the user that created the token
  tokens: Record<string, DigitalBitsToken & { creatorId: string }>;
};
```

### Workflow

Note the usage of a `userId` to identify the "caller" of the endpoint. In production, this would need to be authenticated
and instead replaced with a session token, unless this were to be an isolated microservice that is called only
by another service that handles authentication.

#### 1 Creating a User

`POST /api/users/create` will create a user with a user ID and a DigitalBits account. For example:

Request:

```shell
curl --location --request POST 'http://localhost:3000/api/users/create'
```

Response:

```json
{
    "userId": "tKnyfpxd4JO2GIs-6RTt1"
}
```

Currently, we use the `friend-bot` testnet functionality to fund these accounts with XDB so that transactions
can be executed. In production, we would likely only fund these with a minimum amount, and re-fund as transactions
are executed.

#### 2 Retrieving a User

`GET /api/users?userId=<USER_ID>` will retrieve the full user details including DigitalBits balances. 
For example:

Request:

```shell
curl --location --request GET 'http://localhost:3000/api/users?userId=tKnyfpxd4JO2GIs-6RTt1'
```

Response:

```json
{
    "data": {
        "id": "tKnyfpxd4JO2GIs-6RTt1",
        "digitalBitsAccount": {
            "publicKey": "GCIWGNMMI5PHXCGQLIKFPOBQUFNJYPAICFCKJ6NY6ZJWDTFUQHNYCE2N",
            "secretKey": "SCF6CKJORXR2K4UB7BGN5BNWQ3LVHCVHFTBR64YWIDLWGYNVMX4FYZUJ"
        },
        "balances": [
            {
                "balance": "10000.0000000",
                "buying_liabilities": "0.0000000",
                "selling_liabilities": "0.0000000",
                "asset_type": "native"
            }
        ]
    }
}
```


#### 3 Creating a Token

Let's say that our newly created user with ID `tKnyfpxd4JO2GIs-6RTt1` is a merchant. Let's create a token!

This is possible with `POST /api/tokens/create` with the following request body:

```typescript
type RequestBody = {
  userId: string; // User ID creating this token
  token: {
    code: string; // Alphanumeric up to 12 characters as per XDB guidelines
    name: string; // Not required, but good metadata
  };
};
```

For example:

Request:

```shell
curl --location --request POST 'http://localhost:3000/api/tokens/create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "userId": "tKnyfpxd4JO2GIs-6RTt1",
    "token": {
        "code": "AwesomeToken",
        "name": "My Awesome Tokene"
    }
}'
```

Response:

```json
{
    "success": true
}
```

#### 4 Transferring a Token

Using `POST api/tokens/transfer`, transfers can be made between users. This can occur because of a 
merchant distributing a token refund, or between users when exchanging tokens. The expected request body is:

```typescript
type RequestBody = {
  fromId: string; // User ID transferring token
  toId: string; // Destination user ID
  tokenCode: string; // Asset code of token (must be issued by the toco issuing account)
  amount: number;
};
```

For example, this transfers 10 `AwesomeToken` units from the merchant (`tKnyfpxd4JO2GIs-6RTt1`) to
another user (`zfMb3Eq83dPqCpYvgVryA`):

Request:

```shell
curl --location --request POST 'http://localhost:3000/api/tokens/transfer' \
--header 'Content-Type: application/json' \
--data-raw '{
    "fromId": "tKnyfpxd4JO2GIs-6RTt1",
    "toId": "zfMb3Eq83dPqCpYvgVryA",
    "tokenCode": "AwesomeToken",
    "amount": 10
}'
```

Response:

```json
{
    "success": true
}
```

If we now get the details of the receiving user `zfMb3Eq83dPqCpYvgVryA`, we see that we 
have a balance of `10` for `MyAwesomeToken`:

```json
{
    "data": {
        "id": "zfMb3Eq83dPqCpYvgVryA",
        "digitalBitsAccount": {
            "publicKey": "GADFV5KZFKVGXSCXBCBKEH5WYMQ6LFGOWLDVVZXE3HBJ7XETJDU5PLNA",
            "secretKey": "SA34JUES2JIDCJCFPZK35DMAAJKEA5SHSRVJ3RU355KMWOEKCOOYQ5F7"
        },
        "balances": [
            {
                "balance": "10.0000000",
                "limit": "922337203685.4775807",
                "buying_liabilities": "0.0000000",
                "selling_liabilities": "0.0000000",
                "last_modified_ledger": 1925725,
                "is_authorized": true,
                "is_authorized_to_maintain_liabilities": true,
                "asset_type": "credit_alphanum12",
                "asset_code": "AwesomeToken",
                "asset_issuer": "GCL3PIK65NGMJC4YSR2HFL3EJDCZVQ7IAXTHIJGEIX3BMBQ4VN5X72JO"
            },
            {
                "balance": "9999.9999500",
                "buying_liabilities": "0.0000000",
                "selling_liabilities": "0.0000000",
                "asset_type": "native"
            }
        ]
    }
}
```

## Summary

This service demonstrates a basic workflow for creating, sending, and managing tokens. This is the core
asset logic of the Toco commerce ecosystem.
