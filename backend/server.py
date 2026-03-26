from fastapi import Request,HTTPException
# Updated backend/server.py

# Handle your authorization with Bearer token instead of query parameters.

def some_function(request: Request):
    # Example of how to use authorization header
    authorization_header = request.headers.get('Authorization')
    if authorization_header:
                parts = authorization_header.split(' ')
        if len(parts) == 2:
            token = parts[1]
            # process with the token...
        else:
            raise HTTPException(status_code=401, detail="Invalid Token Format")
    else:
        raise HTTPException(status_code=401, detail="Please Login First")


# Ensure that all instances of token handling in the file are replaced accordingly
