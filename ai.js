// Contains AI Player behavior

/**  */
const AI_FSM = {
    start: {
        next: (state) => {
            return this.booming;
        }
    }, 
    booming: {
        next: (state) => {
            
        }
    },
    attacking: {
        next: (state) => {
            
        }
    }
}

/** @class AI Player Finite State Machine */
class AIFSM {
    /**
     * Creates new FSM
     */
    constructor() {
        this.curState;
    }
}

/** @class AI Player */
class AIPlayer {
    /**
     * Creates an AI Player
     * @param {State} state State object reference
     */
    constructor(state) {
        this.state = state;
        this.fsm = new AIFSM();
    }

    /**
     * Updates AI player each turn
     */
    updateTurn() {

    }

    /**
     * Updates AI player each month
     */
    updateMonth() {
        this.fsm.next();
    }
}