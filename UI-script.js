export function addExpandableButtonUI() {
    const allRecipeExpandables = document.querySelectorAll('.expand-button')
    //basically this is a communal function for both expand buttons and there is fudging.
    for (let expandable of allRecipeExpandables){
        expandable.dataset.isExpanded = false
        expandable.addEventListener('click', (e) => {
            const thingToExpand = e.target.parentElement.parentElement.parentElement.children[Number(e.target.dataset.key)]

            if (expandable.dataset.isExpanded == 'false'){
                let totalHeightOfAllChildren = -10
                for (let child of thingToExpand.children){
                    const computedStyle = window.getComputedStyle(child)
                    totalHeightOfAllChildren += parseFloat(computedStyle.marginTop)
                    totalHeightOfAllChildren += parseFloat(computedStyle.marginBottom)
                    totalHeightOfAllChildren += child.offsetHeight
                }

                e.target.style.transform = 'rotate(180deg)'
                thingToExpand.style.height = totalHeightOfAllChildren + 'px'
                expandable.dataset.isExpanded = true
            }
            else {
                e.target.style.transform = 'none'
                thingToExpand.style.border = 'none'
                thingToExpand.style.height = '0px'
                expandable.dataset.isExpanded = false

                if (expandable.dataset.key == '1'){ // if closing details box, closes comment box if its open
                    const commentButton = thingToExpand.children[2].querySelector('img')
                    if(commentButton.dataset.isExpanded == 'true'){
                        commentButton.click()
                    }
                }
            } 
        })
    }

    for (let commentsReader of document.querySelectorAll('.comments-reader')){ // HERE
        commentsReader.addEventListener('click', (e) => {
            e.target.parentElement.children[2].click()
        })
    }
}

export function windowResizeEvent() {
    let resizeDebounceTimer
    const explanationDiv = document.getElementById('explanation-div')
    const allRecipeExpandables = document.querySelectorAll('.expand-button')
    
    window.addEventListener('resize', (e) => { // fixes height of expanded things if window size changes
        clearTimeout(resizeDebounceTimer)
        resizeDebounceTimer = setTimeout(() => {
            console.log('resize')
            if (explanationDiv.style.maxHeight != '22px'){
                explanationDiv.style.maxHeight = explanationDiv.querySelector('p').offsetHeight + 30 + 'px'
            }
            for (let expandable of allRecipeExpandables){
                if (expandable.dataset.isExpanded == 'true'){
                    // reset height 
                    const thingToExpand = expandable.parentElement.parentElement.parentElement.children[Number(expandable.dataset.key)]
                    let totalHeightOfAllChildren = -10
                    for (let child of thingToExpand.children){
                        const computedStyle = window.getComputedStyle(child)
                        totalHeightOfAllChildren += parseFloat(computedStyle.marginTop)
                        totalHeightOfAllChildren += parseFloat(computedStyle.marginBottom)
                        totalHeightOfAllChildren += child.offsetHeight
                    }
                    thingToExpand.style.height = totalHeightOfAllChildren + 'px'
                }
            }
        }, 200)
    })
}

export function submitCommentEvent(e) {
    const commentTemplate = document.querySelector('.recipe-comment')
    const commentTemplateClone = commentTemplate.cloneNode(true)
    console.log('clixkewd')
    let commentEntryData = {
        type : 'comment',
        recipeID : 1,
        commentText : '',
        username : '',
        timeSubmitted : ''
    }
    
    commentEntryData.recipeID = Number(e.target.parentElement.parentElement.parentElement.parentElement.dataset.recipeID)

    commentEntryData.commentText = e.target.parentElement.parentElement.firstElementChild.value
    if (/^[\s\r\n]*$/.test(commentEntryData.commentText)){ // checks if empty or blank spaces
        window.alert('please include a comment')
        return
    }
    const usernameInput = e.target.parentElement.firstElementChild.value
    commentEntryData.username = (usernameInput === '') ?  'anon' : usernameInput

    const currentDate = new Date()
    let currentDateDay = (currentDate.getDate() + 1).toString()
    if (currentDateDay.length == 1){
        currentDateDay = `0${currentDateDay}`
    }

    let currentDateMonth = (currentDate.getMonth() + 1).toString()
    if (currentDateMonth.length == 1){
        currentDateMonth = `0${currentDateMonth}`
    }

    commentEntryData.timeSubmitted = `${currentDateDay}:${currentDateMonth}:${currentDate.getFullYear()}`

    // begin API call
    const APIFetch = fetch('https://tjjte32ws4pvoihteuzode4k2u0jwupu.lambda-url.eu-north-1.on.aws/', {
        method: 'POST',
        body: JSON.stringify(commentEntryData) 
        })
    
        let APIFetchJSON = APIFetch.then((fetchResolution) => {  //this returns a promise of converting the api data to a JSON
        if (fetchResolution.ok){
            console.log('successful API call')

            e.target.parentElement.parentElement.firstElementChild.value = ''

            e.target.innerHTML = 'Submission Successful!'
            setTimeout(() => {
                e.target.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M470.3 271.15L43.16 447.31a7.83 7.83 0 01-11.16-7V327a8 8 0 016.51-7.86l247.62-47c17.36-3.29 17.36-28.15 0-31.44l-247.63-47a8 8 0 01-6.5-7.85V72.59c0-5.74 5.88-10.26 11.16-8L470.3 241.76a16 16 0 010 29.39z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>'
            }, 2000)

            // add comment visibly
            const commentTemplateCloneOfClone = commentTemplateClone.cloneNode(true)
            commentTemplateCloneOfClone.querySelector('h5').textContent = `By ${commentEntryData.username} on ${commentEntryData.timeSubmitted}:`
            commentTemplateCloneOfClone.querySelector('p').textContent = commentEntryData.commentText
            e.target.parentElement.parentElement.parentElement.insertBefore(commentTemplateCloneOfClone, e.target.parentElement.parentElement)
            // increment counter
            const thisCommentsCounter = e.target.parentElement.parentElement.parentElement.parentElement.children[1].children[2].querySelector('p')
            thisCommentsCounter.innerHTML = Number(thisCommentsCounter.innerHTML) + 1

            window.dispatchEvent(new Event('resize'));

            return fetchResolution.json()
        }
        else {
            console.log('API call failed', fetchResolution.status, fetchResolution.statusText)
            e.target.innerHTML = 'Submission Failed :('
            setTimeout(() => {
                e.target.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M470.3 271.15L43.16 447.31a7.83 7.83 0 01-11.16-7V327a8 8 0 016.51-7.86l247.62-47c17.36-3.29 17.36-28.15 0-31.44l-247.63-47a8 8 0 01-6.5-7.85V72.59c0-5.74 5.88-10.26 11.16-8L470.3 241.76a16 16 0 010 29.39z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>'
            }, 2000)
        }
        })
    
        APIFetchJSON.then((JSONResolution) => console.table(JSONResolution)) // this receives the promise and prints the returned JSON
}

let upvoteDebounceTimer
export function upvoteEvent(e) {
    if (upvoteDebounceTimer){
        console.log('too soon')
        return
    }

    if (e.target.style.fill != 'var(--colour-2)'){ // add upvote
        e.target.style.fill = 'var(--colour-2)'
        let upvoteButtonClone = e.target.cloneNode(true)
        upvoteButtonClone.classList.add('upvote-button-ghost')
        upvoteButtonClone.classList.remove('upvote-button')
        e.target.parentElement.appendChild(upvoteButtonClone)
        e.target.parentElement.querySelector('p').textContent = Number(e.target.parentElement.querySelector('p').textContent) + 1

        setTimeout(() => {
            e.target.parentElement.removeChild(upvoteButtonClone)
        }, 1000)

        
        // send data
        let upvoteData = {
            type : 'upvote',
            recipeId : 0,
            direction : '+'
        }

        upvoteData.recipeId = e.target.parentElement.parentElement.parentElement.parentElement.dataset.recipeID

        const APIFetch = fetch('https://tjjte32ws4pvoihteuzode4k2u0jwupu.lambda-url.eu-north-1.on.aws/', {
            method: 'POST',
            body: JSON.stringify(upvoteData)
        })

        let APIFetchJSON = APIFetch.then((fetchResolution) => {  //this returns a promise of converting the api data to a JSON
        if (fetchResolution.ok){
            console.log('successful API call')
            return fetchResolution.json()
        }
        else {
            console.log('API call failed', fetchResolution.status, fetchResolution.statusText)
        }
        })

        APIFetchJSON.then((JSONResolution) => console.table(JSONResolution)) // this receives the promise and prints the returned JSON
    }
    
    else { // remove upvote
        e.target.style.fill = ''
        e.target.parentElement.querySelector('p').textContent = Number(e.target.parentElement.querySelector('p').textContent) - 1

        //send data
        let upvoteData = {
            type : 'upvote',
            recipeId : 0,
            direction : '-'
        }

        upvoteData.recipeId = e.target.parentElement.parentElement.parentElement.parentElement.dataset.recipeID

        const APIFetch = fetch('https://tjjte32ws4pvoihteuzode4k2u0jwupu.lambda-url.eu-north-1.on.aws/', {
            method: 'POST',
            body: JSON.stringify(upvoteData)
        })

        let APIFetchJSON = APIFetch.then((fetchResolution) => {  //this returns a promise of converting the api data to a JSON
        if (fetchResolution.ok){
            console.log('successful API call')
            return fetchResolution.json()
        }
        else {
            console.log('API call failed', fetchResolution.status, fetchResolution.statusText)
        }
        })

        APIFetchJSON.then((JSONResolution) => console.table(JSONResolution)) // this receives the promise and prints the returned JSON
    }


    upvoteDebounceTimer = setTimeout(() => {
        console.log('waiting 0.5 seconds until next upvote')
        upvoteDebounceTimer = null
    }, 500) 
}
