Contest B module - "Daily Prophet"
====================================

<b>addContestant:</b>

/**
 * creates a new contestant instance object
 * @param  {int} startingVirtualMoney
 * amount of virtual money the user starts
 * @param  {int} numAthletes 
 * number of athletes a user can wager on for the given contest
 * @return {object}
 * object virtual money remaining and an zero filled array for predictions
 */
<b>function createNewContestantInstance(startingVirtualMoney, numAthletes)</b>

/**
 * subtracts entry fee from user's current money, 
 * error if user doesn't have enough
 * @param  {object}   user
 * user object from req.user
 * MUST have user.money
 * @param  {object}   contest
 * contest object from database
 * @param  {Function} callback
 * args: (err)
 */
<b>function subtractMoneyFromUser(user, contest, callback)</b>

/**
 * checks if user has enough money, if contest full, and if user can still enter
 * if passes all checks, updates a user's instances for a given contest
 * if the user is not part of the contest already, inserts the user in
 * else appends a new instance to a list of instances
 * @param {object}   user
 * user object from req.user
 * @param {object}   contest  
 * contest object from database
 * @param {Function} callback
 * args: (err)
 */
<b>function addUserInstanceToContest(user, contest, callback)</b>

/**
 * obtains a lock on adding / removing users for a given contest
 * read the contest
 * adds user to the contest and subtracts money from user
 * releases lock
 * @param {Object}   user
 * req.user passport object, contains username and money fields
 * @param {uuid}   contestId
 * uuid for contest
 * @param {Function} callback
 * args (err)
 */
<b>function addContestant(user, contestId, callback)</b>

/**
 * @param {string}   username
 * @param {string}   contestant 
 * JSON.stringify({
 *   instances: [{contestant instance}]
 * })
 * @param {uuid}   contestId  
 * @param {Function} callback
 * args: (err)
 */
<b>function updateContestant(username, contestant, contestId, callback)</b>

<b>lock:</b>

/**
 * tries to override a lock if locked for too long (could happen)
 * @param  {object}   user       
 * object from req.user
 * @param  {uuid}   contestId
 * @param  {int}   tries     
 * number of attempts to obtain lock
 * @param  {Function}   obtainLock
 * obtainLock function
 * @param  {Function} callback   
 * args: (err)
 */
<b>function tryOverrideLock(user, contestId, tries, obtainLock, callback)</b>

/**
 * obtains a lock of reading and writing to inserting and deleting contestants
 * @param  {object}   user      
 * req.user object
 * @param  {uuid}   contestId 
 * @param  {int}   tries     
 * number of attempts to obtain lock, starts at 0
 * @param  {Function} callback  
 * args: (err)
 */
<b>function obtainLock(user, contestId, tries, callback)</b>

/**
 * starts obtainLock with tries = 0
 * @param  {object}   user      
 * req.user object
 * @param  {uuid}   contestId 
 * @param  {int}   tries     
 * number of attempts to obtain lock, starts at 0
 * @param  {Function} callback
 * args: (err)  
 */
<b>function tryObtainLock(user, contestId, callback)</b>

/**
 * releases lock, called after exited critical region
 * @param  {uuid}   contestId
 * @param  {Function} callback  
 * args: (err)
 */
<b>function releaseLock(contestId, callback)</b>


