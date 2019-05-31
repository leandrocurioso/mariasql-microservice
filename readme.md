# Maria SQL Microservice

Let's imagine that is possible to isolate the responsibility to connect in the database in a microservice. Ahn how? It's simple! This microservice will help you optimize your architecture simply adding this project as your core database handler and also starting, comming and rolbacking transaction without the need to explicity tell. Sometimes you havea lot of microservices and you are tired to add a module to connect to the database every time. Why not do in a single place in a optimized way with connection pool?

**This is the whole reason behind the motivation of this project.**

**This project is also compatible with MySQL database**

### Core Technologies
- [Express npm module](https://www.npmjs.com/package/express) for web framework;
- [MariaSQL npm module](https://www.npmjs.com/package/mariasql) to connect and execute queries in database;
- [Awilix npm module](https://www.npmjs.com/package/awilix) for IoC;

### How does this work?
There is an API with the uri **/v1/query** that will receive an array of queries/binds and this will be executed with the same database connection for each request, so this is an optimized way to avoid open/close the connection every time you execute a sql command.

**You do not need to close the database connection manually** there is a wrapper for express methods:
- res.end
- res.json
- res.send

This will auto close the scoped connection used in the enteire web request cycle. Wow nice! =)

### Query route
The route you call to execute a query is:

**URI:** /v1/query

**HTTP verb:** POST

**Headers:**
````javascript
{
    "X-Api-Key": "Your x api key.",
    "Content-Type": "application/json"
}
````

**Body:**
````javascript
[
	{
		"key": "insert1",
		"sql": "INSERT INTO test (text) VALUES (:text );",
		"params": {
			"text": "Hi!"
		}
	},
	{
		"key": "update1",
		"sql": "UPDATE test SET text = 'Modified hi!' WHERE id = :id;",
		"params": {
			"id": "{{ insert1.insertId }}"
		}
	},
	{
		"key": "select1",
		"sql": "SELECT id, text FROM test;",
		"onlyFirst": true,
		"parser": {
			"id": "integer"
		}
	}
]
````
These instructions will be executed in sequence and you could also use the LAST INSERTED ID from previous INSERT in the next query bind. You can check this in this part: "id": "{{ insert1.insertId }}". When you want to use the insertion id add {{ queryKey.insertId }} to the bind param.

**Response example:**

**HTTP status cude:** 200
````javascript
{
    "resultSets": [
        {
            "insert1": {
                "info": {
                    "numRows": 0,
                    "affectedRows": 1,
                    "insertId": 29
                }
            }
        },
        {
            "update1": {
                "info": {
                    "numRows": 0,
                    "affectedRows": 1,
                    "insertId": 0
                }
            }
        },
        {
            "select1": {
                "id": 1,
                "text": "Modified hi!"
            }
        }
    ]
}
````
As you can see the result will be added as a namespace from the provided query key.

### Parameters 
````javascript
{
    "in": "header",
    "name": "X-Api-Key",
    "type": "string",
    "required": true,
    "description": "Api key to access server resources.",
    "example": "c17d4c2c-6c5c-4267-9968-6b8b42d1d56f"
},
{
  "in": "header",
  "name": "Content-Type",
  "default": "application/json",
  "type": "string",
  "required": true,
  "description": "Request content type",
  "example": "application/json"
},
{
  "in": "body",
  "type": "array",
  "required": true,
  "description": "Array of query objects",
  "schema": {
    "type": "object",
    "properties": {
      "key": {
        "type": "string",
        "required": true,
        "description": "The unique key of a query, this will be the namespace of result set",
        "example": "listOfUsers"
      },
      "sql": {
        "type": "string",
        "required": true,
        "description": "SQL query",
        "example": "SELECT name, balance, is_active FROM users WHERE id = :id;"
      },
      "onlyFirst": {
        "type": "boolean",
        "required": false,
        "description": "If you do not want to return an array pass true to get an object of the first result position.",
        "example": true
      },
      "params": {
        "type": "object",
        "required": false,
        "description": "Param to be bind in query (Prepared Statement) to avoid SQL injection",
        "example": {
          "id": 1
        }
      },
      "parser": {
        "type": "object",
        "required": false,
        "description": "By the default all results are returned as string, if you want to parse them for instance to integer pass this object.",
        "example": {
          "id": "integer",
          "balance": "float",
          "is_active": "boolean"
        }
      }
    }
  }
}
````

### Setting up the project
Follow this steps but first! For each parameter go to **Environment Configuration** to read the documentation.

1- Open the .env file located in the project root folder and change the database configuration as desired. For each parameter go to **Environment Configuration** documentation.
2- High recommended to change the swaggeer username and password to read the documentation for security reasons.

### Instructions to run the project

In the temrinal browser to the project folder and type:

1 - To install the dependencies
`````
npm install
`````

2a - To run the application in development mode

`````
npm watch
`````

2b - To run the application in production mode

`````
npm start
`````

### Swagger Documentation

After you run the project you can go to the URL: **/swagger/api-docs** to read the api docs. THe username and password can be found in the Swagger environment configuration.

### Environment Configuration

The configuration is in the **.env** file located in the root folder.

### System

**SYSTEM_CONTROLLER_PATH**
**Type:** string
**Default:** ./src/application/controller
The controller folder path. Basically you should not change this value unless you know what you are doing.

### Server

**NODE_ENV**<br/>
**Type:** string<br/>
**Default:** development<br/>
**Possible values:** development | production<br/>
The environment execution mode.<br/>

**SERVER_PORT**<br/>
**Type:** integer<br/>
**Default:** 3000<br/>
A port number to run the microservice.<br/>

**SERVER_X_API_KEY**<br/>
**Type:** string<br/>
**Default:** 47661a53-eadf-458b-b16a-801915412d10<br/>
A static api key string that must be passed in the HTTP header when calling the API.<br/>
**Header key:** X-Api-Key<br/>

**SERVER_TIMEZONE**<br/>
**Type:** string<br/>
**Default:** UTC<br/>
The application timezone, this is a specific environment variable for process.env.TZ.<br/>

### Logger<br/>

**LOGGER_TRANSPORTS**<br/>
**Type:** array<string><br/>
**Default:** file<br/>
**Possible values:** console | file<br/>
The transport layers for [Winston](https://github.com/winstonjs/winston) logger module, basically where the logs will be dispached, it is an array of strings so if you want to log it in console and file together use it with comma separation.<br/>

**LOGGER_LOG_FILENAME**<br/>
**Type:** string<br/>
**Default:** /log/application.log<br/>
The filepath location for LOGGER_TRANSPORTS when file transport is active.<br/>

**LOGGER_LOG_LEVEL**<br/>
**Type:** string<br/>
**Default:** info<br/>
**Possible values:** debug | file | log | info | warn | error<br/>
The log level.<br/>

### MariaDB<br/>

**DB_MARIA_HOST**<br/>
**Type:** string<br/>
**Default:** 127.0.0.1<br/>
The database host.<br/>

**DB_MARIA_DATABASE**<br/>
**Type:** string<br/>
**Default:** db<br/>
The database name.<br/>

**DB_MARIA_USER**<br/>
**Type:** string<br/>
**Default:** root<br/>
The database user.<br/>

**DB_MARIA_PASSWORD**<br/>
**Type:** string<br/>
**Default:** 123456<br/>
The database password.<br/>

**DB_MARIA_PORT**<br/>
**Type:** integer<br/>
**Default:** 3306<br/>
The database port.<br/>

**DB_MARIA_CHARSET**<br/>
**Type:** string<br/>
**Default:** utf8mb4<br/>
The database charset.<br/>

**DB_MARIA_CONNECTION_TIMEOUT**<br/>
**Type:** integer<br/>
**Default:** 120<br/>
The connection timeout.<br/>

**DB_MARIA_PING_INACTIVE**<br/>
**Type:** integer<br/>
**Default:** 60000<br/>
The ping inactive connection interval.<br/>

**DB_MARIA_PING_WAIT_RESPONSE**<br/>
**Type:** integer<br/>
**Default:** 60000<br/>
The ping wait response for connection.<br/>

**DB_MARIA_MIN_CONNECTIONS**<br/>
**Type:** integer<br/>
**Default:** 1<br/>
The minimum amount of connections in the pool.<br/>

**DB_MARIA_MAX_CONNECTIONS**<br/>
**Type:** integer<br/>
**Default:** 2<br/>
The maximum amount of connections in the pool.<br/>

### Controller<br/>

**CONTROLLER_MAXIMUM_SQL_QUERY_LENGTH**<br/>
**Type:** integer<br/>
**Default:** 5000<br/>
For the **API /v1/query** the maximum length of sql string instruction.<br/>

### Repository Service<br/>

**REPOSITORY_SERVICE_AUTO_TRANSACTION**<br/>
**Type:** integer<br/>
**Default:** 1<br/>
**Possible values:** 0 | 1 <br/>
If auto trasaction is active or not. If you pass an array to **API /v1/query** with more than 1 sql verb candidate for transaction it will auto start, coomit or rollback the transaction. Very powerful resource.
**SQL candidates:** INSERT | UPDATE | DELETE<br/>

**REPOSITORY_SERVICE_LOG_QUERY**<br/>
**Type:** integer<br/>
**Default:** 1<br/>
**Possible values:** 0 | 1 <br/>
If you want to log the executed query and his parameters.<br/>

**REPOSITORY_SERVICE_FORBIDDEN_SQL_VERBS**<br/>
**Type:** araat<string><br/>
**Default:** DROP,TRUNCATE,CREATE,ALTER<br/>
A list of SQL verbs that will not be executed for security or permissions scope.<br/>

### Swagger<br/>

**SWAGGER_USERNAME**<br/>
**Type:** string<br/>
**Default:** admin<br/>
The username to read the aoi docs.<br/>

**SWAGGER_PASSWORD**<br/>
**Type:** string<br/>
**Default:** 123456<br/>
The user password to read the aoi docs.<br/>

# Feedbacks / Contributions
If you want to give feedback or contribute to this project please contact me: [leandro.curioso@gmail.com](mailto:leandro.curioso@gmail.com)

