import { useState, useEffect } from 'react'
import './styles.css'
import olmi from './../images/olm.jpg'
import olmleft from './../images/olmleft.jpg'
import olmright from './../images/olmright.jpg'
import hit from './../images/hit.jpg'
import hitzero from './../images/hitzero.jpg'

const App = () => {
    const rows = 3
    const cols = 16

    const startState = Array.from({ length: rows }, (row, rowIndex) => 
    Array(cols).fill(false).map((value, colIndex) => (rowIndex === 1 && colIndex === 8))
  )

    const [squares, setSquares] = useState(startState) // The grid of the room
    const [location, setLocation] = useState({row: 1, col: 8}) // Players location
    const [targetSquare, setTargetSquare] = useState(null) // Square to which the player is set to move to
    const [path, setPath] = useState(null) // Squares where the player will step on the way to targetSquare
    const [olmDirection, setOlmDirection] = useState('middle') // The direction where Olm is looking at
    const [olmTick, setOlmTick] = useState(0) // Olm attacks every 4 ticks. olmTick loops through values 0-3 every tick and olm attacks or turns his head when olmTick === 3
    const [olmCycle, setOlmCycle] = useState(0) // Olm loops through 4 attacks. Keeps track of the cycle
    const [attack, setAttack] = useState(false) // Keeps track if the player has queued an attack
    const [targetHand, setTargetHand] = useState(null) // Keeps track fo which hand player is hitting
    const [handHit, setHandHit] = useState(false) // Keeps track if the players attack on the hand was succesful or not. Helps in handling olms head properly
    const [splatShow, setSplatShow] = useState(false) // True = show hit splat element, False = hide element
    const [splatType, setSplatType] = useState(null) // Type of hit splat to show
    const [olmHit, setOlmHit] = useState(null) // Visual of the olms attacks
    const [attackAllow, setAttackAllow] = useState(true) // Boolean to tell if player is ready to attack again
    const [tick, setTick] = useState(0)

    useEffect(() => {
      setInterval(() => {
        setTick(t => t + 1)
      }, 600)
    }, [])


    // Hook sets a timer to hide the hitsplat element 0.9s after the attack
    useEffect(() => {
        if (splatShow) {
            const timer = setTimeout(() => {
                setSplatShow(false)
            }, 900)
            return () => clearTimeout(timer);
        }
    }, [splatShow])


    // Hook sets a timer to hide the olm attack after 0.9s
    useEffect(() => {
        if (olmHit) {
            const timer = setTimeout(() => {
                setOlmHit(null)
            }, 900)
            return () => clearTimeout(timer);
        }
    }, [olmHit])


    // Handles click of a square on the grid to move player. Sets target square to be the clicked one
    const handleClick = (row, col) => {
        setAttack(false) // Cancels attack command if one is set
        setTargetSquare({row: row, col: col})
    }


    // Handles clicking of the olms right hand
    const handleRightClick = () => {
        setAttack(true) // Attack command is set
        setTargetHand('right') // Target
        // If the player is too far from the hand this paths the character closer to attack
        if (location.col > 11) {
            setTargetSquare({row: location.row, col: 11})
        } else {
            setTargetSquare({row: location.row, col: location.col})
            setPath(null)
        }
    }


    // Handles clicking of olms left hand
    const handleLeftClick = () => {
        setAttack(true)
        setTargetHand('left') // Target hand is used to show hitsplat on the correct hand
        // The player is pathed to melee range of the hand
        // From the left side to the leftmost tile of the hand
        if (location.col < 10) {
            setTargetSquare({row: 0, col: 10})
            return
        }
        // From the right side to the rightmost tile of the hand
        if (location.col > 14) {
            setTargetSquare({row: 0, col: 14})
            return
        }
        // If player is on one of the columns of the hand he is pathed to the closest square
        setTargetSquare({row: 0, col: location.col})
    }

    
    // Hook to calculate path to the target whenever targetSquare changes 
    useEffect(() => {
      if (targetSquare) calculatePath(location, targetSquare)
    }, [targetSquare])


    // Calls the playerAttack() -function if an attack is queued and the targetSquare is reached
    useEffect(() => {
      if (targetSquare) {
        // Calls playerAttack() when the player is in range and attack is allowed
        if (location.row === targetSquare.row && location.col === targetSquare.col && attack && attackAllow) {
            playerAttack()
        }
      }
    }, [location, tick])


    // The type of olms attack is determined by the olmCycle variable here
    // olmCycle loops through values 0-3 every 4 ticks
    const olmAttack = () => {
        switch (olmCycle) {
            case 0:
                setOlmHit('auto')
                setOlmCycle(1)
                break
            case 1:
                setOlmHit('special')
                setOlmCycle(2)
                break
            case 2:
                setOlmHit('auto')
                setOlmCycle(3)
                break
            case 3:
                setOlmHit(null)
                setOlmCycle(0)
                break
        }
    }


    // Determines if the players attack hits or not, unhides the hitsplat element and sets player attack on cooldown
    const playerAttack = () => {
        setAttackAllow(false)
        // Timer to allow player to attack again after 2.1 seconds or 3.5 ticks
        // Timer is set to 3.5 ticks to make sure player is ready to attack again at 4th tick and not on 3rd tick
        const timer = setTimeout(() => {
            setAttackAllow(true)
        }, 2100)
        // 4/5 chance to succesfully hit the hand
        if (Math.random() < 0.8) {
            // Block helps to handle olms head turning properly depending on if the right hand
            // is succesfully hit or not
            if (targetHand === 'right') {
                setHandHit(true)
            }
            setSplatShow(true)
            setSplatType(hit)
        } else {
            setSplatShow(true)
            setSplatType(hitzero)
        }
        return () => clearTimeout(timer);
    }


    // Handles events that occur every tick. Keeps track of olms state
    useEffect(() => {
        if(path && path.length > 0) move() // Moves the player if needed

        switch (olmTick) {
            case 0:
                setOlmTick(1)
                break
            case 1:
                setOlmTick(2)
                break
            case 2:
                setOlmTick(3)
                break
            case 3:
                // If olm has vision of the player olm attacks, otherwise the head turns to look at the player
                if (checkVision()) {
                    olmAttack()
                } else {
                    if (location.col < 2) {
                        setOlmDirection('left')
                    }
                    if (location.col > 7 && location.col < 13 && olmDirection === 'left') {
                        setOlmDirection('middle')
                    }
                    if (location.col < 7 && location.col > 1 && olmDirection === 'right') {
                        setOlmDirection('middle')
                        if (handHit) {
                            setOlmDirection('left')
                            setHandHit(false)
                        }
                    }
                    if (location.col > 12) {
                        setOlmDirection('right')
                    }
                    if (olmCycle < 3) setOlmCycle(olmCycle + 1)
                    else setOlmCycle(0)
                }
                setHandHit(false)
                setOlmTick(0)
                break
        }
    }, [tick])

   
    // Checks if the olm can currently see the player
    const checkVision = () => {
        switch (olmDirection) {
            case 'left':
                if (location.col > 7) return false
                break
            case 'middle':
                if (location.col < 2 || location.col > 12) return false
                break
            case 'right':
                if (location.col < 7) return false
                break
        }
        return true
    }
    

    // Moves the player along the path set in path-array. One step every tick
    const move = () => {
        const updatedSquares = [...squares]
        updatedSquares[location.row][location.col] = !updatedSquares[location.row][location.col] // Previous location is set to false
        updatedSquares[path[0].row][path[0].col] = !updatedSquares[path[0].row][path[0].col] // New location is set to true
        setLocation({row: path[0].row, col: path[0].col})
        setSquares(updatedSquares)
        path.shift() // path[0] is cleared from the array
    }


    // Calculates path to the target square
    const calculatePath = (location, target) => {
        const steps = []
        const colDiff = target.col - location.col
        
        if (colDiff != 0) {
            for (let col = colDiff > 0 ? location.col + 2 : location.col - 2; colDiff < 0 ? (col > target.col) : (col < target.col); col += colDiff > 0 ? 2 : -2) {
                steps.push({ row: location.row, col });
            }
        }
      
        steps.push(target)
        setPath(steps)
    }


    // Handles which olm image to show based on olmDirection
    const Olm = () => {
        switch(olmDirection) {
            case 'left':
                return (
                    <img src={olmleft} className='image' />
                )
            case 'middle':
                return (
                    <img src={olmi} className='image' />
                )
            case 'right':
                return (
                    <img src={olmright} className='image' />
                )
            default:
                return (
                    <img src={olmi} className='image' />
                )
        }
    }


    return (
        <div className='room'>
            
            <div className='parent'>
                <div className='child splat'>
                {(splatShow && targetHand === 'right') && <img src={splatType} className='splat' />}
                </div>
                <div className='child right'>
                    <button className='hand' onClick={handleRightClick}>Right hand</button>
                </div>
                <div className='child'>
                    <Olm />
                </div>
                <div className='child splat'>
                {(splatShow && targetHand === 'left') && <img src={splatType} className='splat' />}
                </div>
                <div className='child'>
                    <button className='hand' onClick={handleLeftClick}>Left hand</button>
                </div>
            </div>
                
            {squares.map((row, rowIndex) => (
                <div key={rowIndex} className='board-row'>
                    {row.map((squareState, colIndex) => (
                        <button
                        key={colIndex}
                        onClick={() => handleClick(rowIndex, colIndex)}
                        className={`square ${squareState ? 'true' : ''} ${rowIndex === 0 && (colIndex === 1 || colIndex === 6 || colIndex === 13 ) ? 'marked' : ''}`}
                        ></button>
                    ))}
                </div>
            ))}
            <p className={`olm-hit ${olmHit}`}>{olmHit}</p>
        </div>
    )
}

export default App