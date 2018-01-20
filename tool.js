
/*
 * const Tool = require('tool');
 * const tool = new Tool();
 * tool.option( "-v", () => this.verbose = true );
 * tool.option( "--config", (id) => this.config = id );
 * tool.parse( process.argv );
 */

module.exports = Tool;

/*
 * The handlers argument is an object with methods for each
 * subcommand.
 */
function Tool( handlers ) {
    this.settings = { };
    this.options = {};
    this.commands = {};
    this.option( ["--verbose","-v"], false );

    if ( typeof handlers !== 'object' ) return;
    function is_method( property ) {
        return typeof handlers[property] === 'function';
    }

    /*
     * For each member of "handlers" whose value is a function, add
     * it to the "commands" member of this Tool object with a key of
     * the slot name.
     */
    var methods = Object.getOwnPropertyNames(handlers).filter( is_method );
    methods.map( (method) => this.command(method, handlers[method]) );
    // do the same for OwnProperties that are arrays as bool options
    // and objects as options with default values
}

/*
 * Attach a function to the commands member object with the key
 * "name".  When the tool is evaluated, if the subcommand is present
 * in this "commands" object, then that function will be called.
 */
Tool.prototype.command = function ( name, callback ) {
    this.commands[name] = callback;
};

/*
 * Alias one command name for another.  Throw an error if an
 * alias already exists - it might overwrite a primary command.
 */
Tool.prototype.alias = function ( name, aliases ) {
    function create_alias( aka ) {
        if ( typeof this.commands[aka] !== 'undefined' ) {
            throw "cannot redefine alias";
        }
        this.commands[aka] = this.commands[name];
    }
    aliases.map( create_alias );
};

/*
 * It would be nice to allow for default values for these
 * options.  Also, how to connect -v and --verbose
 *
 * Filter off the "--" ?
 * Default settings name should be the same as the option
 * name.
 */
Tool.prototype.option = function ( arg, default_value ) {
    // if arg is an array - then they are all aliases, the first
    // being the name of the setting
    var primary = Array.isArray(arg) ? arg.shift() : arg;
    var name = primary.replace("--","");
    this.settings[name] = default_value;

    this.options[primary] = function (value) {
        var settings = this;
        settings[name] = value;
    };

    if ( Array.isArray(arg) === false ) return;
    var o = this.options;
    arg.map( (e) => o[e] = o[primary] );
};

Tool.prototype.help = function () {
    for ( var option in this.options ) {
        console.log( option );
    }
    for ( var command in this.commands ) {
        if ( command === 'help' ) continue;
        console.log( command );
    }
}

function parse_option( arg ) {
    if ( ! arg.match(/^-.*/) ) return true;

    var [key,value] = arg.split("=");
    var handler = this.options[ key ];
    if ( typeof handler === 'undefined' ) {
        console.log( "unknown option: " + arg );
        process.exit( -1 );
    }

    // check/error if handler accepts argument
    handler.call( this.settings, value || true );
    return false;
}

/*
 * Validate that the options make sense.  This is expected
 * to be overridden by descendant objects.
 */
Tool.prototype.validate = function () {
    // do nothing here
}

/*
 * Pass in process.argv
 *
 * First filter all options from the command line and store their
 * settings, then look the the subcommand in the tool command list.
 * Pass remaining arguments as arguments to the subcommand.
 */
Tool.prototype.evaluate = function ( argv ) {
    const node_exec = argv.shift();
    const script = argv.shift();

    argv = argv.filter( parse_option.bind(this) );
    this.validate();

    var command_name = argv.shift();
    var command       = this.commands[ command_name ];
    if ( typeof command === 'undefined' ) {
        this.help();
        process.exit( 1 );
    }
    command.apply( this.settings, argv );
};

/* vim: set autoindent expandtab sw=4 syntax=javascript: */
