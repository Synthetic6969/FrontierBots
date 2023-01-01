module.exports = {
    recruit         : require('./recruit'),     // /recruit   <user>              { cooldown : Null }     ( certain ranks may need to specify a garrison and troop )
    verify          : require('./verify'),      // /verify    <username>          { cooldown : Null }
    setrank         : require('./setrank'),     // /setrank   <user> <reason>     { cooldown : 5 }        ( certain ranks may only be promoted to by an owner )
    discharge       : require('./discharge'),   // /discharge <user> <reason>     { cooldown : 10, buttons : [ General, Dishonourable ] }     (  )
}