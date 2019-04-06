const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

rl.prompt();

//Current Directory Global Object
let currentDirectory = {
    path:'/',
    name: 'root'
};

//File system array
let fileSystem = [];
let rmIndex = 0;

//Adding root directory to the file system
let root = new Directory('root', currentDirectory.path);
fileSystem.push(root);
/*console.log(fileSystem);*/

//Constructor for directory creation
function Directory(name, parent) {
    this.name = name;
    this.parentDirectory = parent;
}

/**
 * Accepts the input from the console and splits it to command name, argument and flag
 * @param cmd
 * @returns {Object}
 */
function extractCommand(cmd) {
    let input = cmd.split(" ");
    let command = new Object();

    //name of the command
    command.name = input[0];

    //argument of the command (eg: name of the directory after mkdir)
    command.argument = input[1];

    //flag of the command (eg: may be delete directory recursively)
    command.flag = input[2];

    return command;
}

/**
 * Takes input from command line and calls appropriate command
 */
rl.on('line', (line) => {
    let cmd = extractCommand(line);

    switch (cmd.name) {
        case 'pwd':
            printToScreen(pwd(cmd));
            break;

        case 'mkdir':
            printToScreen(mkdir(cmd));
            break;

        case 'cd':
            printToScreen(cd(cmd));
            break;

        case 'ls':
            printToScreen(ls(cmd));
            break;

        case 'rm':
            printToScreen(rm(cmd));
            break;

        case 'session':
            printToScreen(session(cmd));
            break;

        default:
            printToScreen(new Error(`CANNOT RECOGNIZE INPUT '${line.trim()}'`));
            break;
    }
    rl.prompt();
}).on('close', () => {
    console.log('Have a great day!');
    process.exit(0);
});

/**
 * print To Screen function prints to screen based on error and success condition
 * parameter res should be an instance of Error or a success object
 * @param res
 */

function printToScreen(res) {
    if(res instanceof Error) {
        console.log('ERR: ' + res.message)
    } else {
        if(res.code === 200) {
            console.log('SUCC: ' + res.message);
        } else if(res.code === 403) {
            console.log('Something Bad Happened! '+ res.message)
        }
    }
}


/**
 * pwd lists the current directory and this command accepts no arguments
 * Argument: Not Required
 * @param cmd
 * @returns {any}
 */

function pwd(cmd) {
    /*console.log(cmd)*/
    if(cmd.argument){
        let error = new Error('Invalid Argument');
        return error;
    } else if (!cmd.argument) {

        let response = new Object({
            code: 200,
            status: 'success',
            message: 'PATH:' + currentDirectory.path
        });
        return response;
    } else {
        return new Object({
            code: 403,
            status: 'unknown',
            message: 'Paranormal Activity'
        })
    }

}

/**
 * Command creates a directory according to the current position in the filesystem.
 * Required: Argument
 * @param cmd
 * @returns {any}
 */
function mkdir(cmd) {
    /*console.log(cmd);*/
    if(!cmd.argument) {
        let error = new Error('Invalid Directory Name');
        return error;
    } else if(cmd.argument) {
        cmd.argument = cmd.argument.replace('/','');
        if(checkIfDirectoryExists(cmd.argument)) {
            let error = new Error('Directory already exists');
            return error;
        } else {
            let dir = new Directory(cmd.argument, currentDirectory.name);
            fileSystem.push(dir);
            let response = new Object({
                code: 200,
                status: 'success',
                message: 'Created ' + dir.name
            });
            /*console.log(fileSystem);*/
            return response;
        }
    }
}


/**
 * Changes directory and ('' & '/') can be used to navigate to root directory from anywhere.
 * Use relative path to navigate. Absolute path can be used from root directory.
 *
 * We can also extend it for using absolute path from anywhere by using a '~' element like in linux.
 * @param cmd
 * @returns {any}
 */
function cd(cmd) {
    /*console.log(cmd)*/
    if(!cmd.argument) {
        currentDirectory = {
            path:'/',
            name: 'root'
        };

        return new Object({
            code: 200,
            status: 'success',
            message: 'Reached root directory'
        });

    } else if(cmd.argument) {
        if(cmd.argument === '/') {
            currentDirectory = {
                path:'/',
                name: 'root'
            };

            return new Object({
                code: 200,
                status: 'success',
                message: 'Reached root directory'
            });
        }
        let splitPath = cmd.argument.split('/');
        let temp = new Object();
        temp = currentDirectory;
        /*console.log(temp);*/
        let response = changeDirectory(splitPath);
        rmIndex = 0;
        if(response) {
            return new Object({
                code: 200,
                status: 'success',
                message: 'Reached '
            });
        } else {
            currentDirectory = temp;
            let error = new Error('Invalid Path');
            return error;
        }
    }
}

/**
 * Checks if directory name exists with respect to current directory
 * @param dirName
 * @returns {boolean}
 */
function checkIfDirectoryExists(dirName) {
    /*console.log(dirName)*/
    for(let i=0;i<fileSystem.length;i++){
        if(dirName === fileSystem[i].name
            && fileSystem[i].parentDirectory === currentDirectory.name) {
            rmIndex = i;
            return true;
        }
    }
    return false;
}


/**
 * Changes the current directory.
 * Used for: rm and cd
 * @param splitPath
 * @returns {boolean}
 */

function changeDirectory(splitPath) {
    let i = 0;
    if(splitPath[i] === '') {
        i = 1;
    }
    for(i;i<splitPath.length;i++) {
        if(checkIfDirectoryExists(splitPath[i])){
            if(currentDirectory.name === 'root') {
                currentDirectory = {
                    path: currentDirectory.path + splitPath[i],
                    name: splitPath[i]
                }
            } else {
                currentDirectory = {
                    path: currentDirectory.path + '/' + splitPath[i],
                    name: splitPath[i]
                }
            }
        } else {
            return false;
        }
    }

    return true;

}

/**
 * lists the directories in current directory.
 * @param cmd
 * @returns {any}
 */

function ls(cmd) {
    if(cmd.argument){
        let error = new Error('Invalid Argument');
        return error;
    } else if (!cmd.argument) {
        return findDirectoriesInCurrentFolder();
    } else {
        return new Object({
            code: 403,
            status: 'unknown',
            message: 'Paranormal Activity'
        })
    }
}

/**
 * Goes through the filesystem and lists all the directories.
 * Argument: Not Required
 * @returns {Object}
 */
function findDirectoriesInCurrentFolder() {
    let dirs = [];
    for(let i=0; i<fileSystem.length; i++) {
        if(currentDirectory.name === fileSystem[i].parentDirectory) {
            dirs.push(fileSystem[i].name);
        }
    }
    if(dirs.length > 0) {
        let response = new Object({
            code: 200,
            status: 'success',
            message: 'DIRS: ' + dirs.toString()
        });
        /*console.log(dirs.toString())*/
        return response;
    } else {
        let response = new Object({
            code: 403,
            status: 'unknown',
            message: 'No directories found'
        });
        return response;
    }
}

/**
 * Removes a directory via absolute path from root or relative path from directory;
 * Could be extended to check whether the folder being deleted
 * has sub folders and then providing with an option to recursively deleting the folders.
 * Argument: Required
 * @param cmd
 * @returns {any}
 */

function rm(cmd) {
    /*console.log(cmd);*/
    if(!cmd.argument) {
        let error = new Error('Invalid Directory Name');
        return error;
    } else if(cmd.argument) {
        let splitPath = cmd.argument.split('/');
        if(splitPath[1]) {
            splitPath[1] = splitPath[1].replace('/','');
        }
        let temp = new Object();
        temp = currentDirectory;
        let response = changeDirectory(splitPath);

        if(rmIndex === 0) {
            return new Error('Can\'t delete root');
        }
        fileSystem.splice(rmIndex,1);
        rmIndex = 0;
        currentDirectory = temp;
        if(response) {
            return new Object({
                code: 200,
                status: 'success',
                message: 'Deleted '
            });
        } else {
            rmIndex = 0;
            currentDirectory = temp;
            let error = new Error('Invalid Path');
            return error;
        }

    }
}

/**
 * Clearing session and reseting the application without exiting.
 * @param cmd
 * @returns {any}
 */

function session(cmd) {
    if(!cmd.argument) {
        let error = new Error('Please provide an argument');
        return error;
    } else if(cmd.argument) {
        if(cmd.argument === 'clear'){
            fileSystem = [];
            rmIndex = 0;

            root = new Directory('root', currentDirectory.path);
            fileSystem.push(root);
            currentDirectory = {
                path:'/',
                name: 'root'
            };
            return new Object({
                code: 200,
                status: 'success',
                message: 'Session Cleared'
            });
        }
        else {
            return new Error('Session Argument not found')
        }
    }

}