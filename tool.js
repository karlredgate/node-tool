
/*
 * const Tool = require('tool');
 * const tool = new Tool();
 * tool.option( "-v", () => this.verbose = true );
 * tool.option( "--config", (id) => this.config = id );
 * tool.parse( process.argv );
 */

module.exports = Tool;

function Tool() {
    this.settings = {
        verbose: false
    };
    this.options = {};
    this.commands = {};
}

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
        console.log( "Set option " + name + " to " + value );
    };

    if ( Array.isArray(arg) === false ) return;
    var o = this.options;
    arg.map( (e) => o[e] = o[primary] );
};

Tool.prototype.command = function ( name, callback ) {
    this.commands[name] = callback;
};

Tool.prototype.help = function () {
    for ( var option in this.options ) {
        console.log( option );
    }
    for ( var coommand in this.commands ) {
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
 * Pass in process.argv
 */
Tool.prototype.evaluate = function ( argv ) {
    const node_exec = argv.shift();
    const script = argv.shift();

    argv = argv.filter( parse_option.bind(this) );
    var command_name = argv.shift();
    var command       = this.commands[ command_name ];
    if ( typeof command === 'undefined' ) {
        this.help();
        process.exit( 1 );
    }
    command.apply( this.settings, argv );
};

/* vim: set autoindent expandtab sw=4 syntax=javascript: */
