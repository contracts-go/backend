# Contracts Go Backend 
The main functionality for this server is not to manipulate data but to 
handle the stuffs we can't do on the frontend.  
Right now, that consists of only sending emails and generating .docx files.  

Glamorous.

## Private files
As this is not a private repo, __cough cough__, some necessary files are left out.  
In the config/ directory:
- **private.firebaseCreds.json**  
A service account file from Firebase. Necessary for production env.
- **private.devfirebaseCreds.json**  
Another service account file from Firebase testing database.
 Necessary for development env.
- **private.config.json**
```json
{
  "development": {
    "mail": {
      "username": "Google Username",
      "password": ""
    }
  },
  "production": {
    "mail": {
      "username": "Google Username",
      "password": ""
    }
  }
}
```

## Scripts

### Gulp
We're using Gulp for handling documentation and maybes more in future.  
See those commands with `gulp help` and the [Documentation Section](#docs).  

### npm
- test: runs all the tests in the test/ directory. Uses mocha. 
- lint: lints the code with eslint. See .eslintrc.yml for config.
- start: runs the server (default port:5000)

```bash
npm run [script]
```

## Documentation <a name="docs"></a>
API documentation is written inline and generated into Swagger 2.0 format.  
Codebase documentation is generated with jsdoc.  

To generate both run:
```bash
gulp doc
```

Or simply `gulp doc-swagger` + `gulp doc-jsdoc` to generate each separate 
set of docs.  

Should be able to run ```gulp servedocs``` to serve them locally.

