// Based on https://stackoverflow.com/questions/42912755/how-to-create-a-db-for-mongodb-container-on-start-up/42917632

db.createUser(
        {
            user: 'root',
            pwd: 'password',
            roles: [
                {
                    role: "readWrite",
                    db: 'powosm'
                }
            ]
        }
);