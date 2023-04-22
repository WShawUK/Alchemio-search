// ascend descend button
const ascendDescendButton = document.getElementById('ascend-descend-button')
let sortDirectionIsAscending = false
ascendDescendButton.addEventListener('click', (e) => {
    ascendDescendButton.firstElementChild.classList.toggle('ascending')
    sortDirectionIsAscending = !sortDirectionIsAscending
})

//sort options styling

let allSortOptions = document.getElementById('sort-options').querySelectorAll('li')
let currentSortOption = allSortOptions[0]
for (let sortOption of allSortOptions){
    sortOption.addEventListener('click', (e) => {
        currentSortOption.classList.toggle('sort-option-selected')
        sortOption.classList.toggle('sort-option-selected')
        currentSortOption = sortOption
    })
}

// slider
const limitSlider = document.getElementById('how-many-to-show-slider')
const limitSliderReader = limitSlider.parentElement.firstElementChild
limitSlider.addEventListener('change', (e) => {
    limitSliderReader.innerHTML = `Show ${limitSlider.value} recipes`
})









//must load all newly added recipes BEFORE adding the button expand stuff

const recipeTemplate = document.querySelector('.shown-recipe')
const recipeTemplateClone = recipeTemplate.cloneNode(true)
recipeTemplateClone.style.display = 'block'
const commentTemplate = document.querySelector('.recipe-comment')
const commentTemplateClone = commentTemplate.cloneNode(true)

document.getElementById('search-button').addEventListener('click', searchAndReceiveRecipes)


//initial receive recent recipes code
function searchAndReceiveRecipes() {
    document.getElementById('all-new-recipes').innerHTML = '' // clear old recipes
    let searchDataToSend = {
        type : 'search',
        searchTerms : [],
        sort : 'id',
        sortDirection : 'DESC',
        numberToReceive : 10
    }

    if (document.getElementById('search-terms-input').value){
        searchDataToSend.searchTerms = document.getElementById('search-terms-input').value.split(' ')
    }
    const sortRelation = {
        'Upvotes' : 'upvotes',
        'Ingredients' : 'ingredients_count',
        'Steps' : 'instructions_count',
        'Time' : 'id',
        'Name' : 'name'
    }
    searchDataToSend.sort = sortRelation[currentSortOption.textContent]

    searchDataToSend.sortDirection = (sortDirectionIsAscending) ? 'ASC' : 'DESC'

    searchDataToSend.numberToReceive = Number(document.getElementById('how-many-to-show-slider').value)

    console.table(searchDataToSend)


    // begin API call
    const APIFetch = fetch('https://tjjte32ws4pvoihteuzode4k2u0jwupu.lambda-url.eu-north-1.on.aws/', {
    method: 'POST',
    body: JSON.stringify(searchDataToSend)
    })

    let APIFetchJSON = APIFetch.then((fetchResolution) => {  //this returns a promise of converting the api data to a JSON
    if (fetchResolution.ok){
        console.log('successful API call')
        console.log(fetchResolution, fetchResolution.body)
        return fetchResolution.json()
    }
    else {
        console.log('API call failed', fetchResolution.status, fetchResolution.statusText)
        window.alert('search failed, this should never happen.')
    }
    })

    APIFetchJSON.then((receivedData) => {  // this receives the promise and prints the returned JSON
        console.table(receivedData)
        if (receivedData == 'search returned nothing'){
            document.getElementById('new-recipes-div').querySelector('h3').innerHTML = 'No results found'
            setTimeout(() => {
                document.getElementById('new-recipes-div').querySelector('h3').innerHTML = 'Search results:'
            }, 2000);
        }
        else  if (receivedData){
            renderRecipeData(receivedData) //ends by calling the render function
        }
    }) 
}

function renderRecipeData(recipeData){
    // return
    for (let recipe of recipeData[0]){
        const recipeTemplateCloneOfClone = recipeTemplateClone.cloneNode(true)

        const recipeID = recipe[0]
        recipeTemplateCloneOfClone.dataset.recipeID = recipeID

        const recipeName = recipe[1]
        recipeTemplateCloneOfClone.children[0].querySelector('h3').textContent = recipeName
        
        const recipeIngredientsCount = recipe[3]
        recipeTemplateCloneOfClone.children[0].querySelector('.ingredients-reader').querySelector('p').textContent = recipeIngredientsCount

        
        const recipeInstructionsCount = recipe[5]
        recipeTemplateCloneOfClone.children[0].querySelector('.steps-reader').querySelector('p').textContent = recipeInstructionsCount

        const recipeTags = recipe[6]
        recipeTemplateCloneOfClone.children[0].querySelector('.tags-reader').querySelector('p').textContent = recipeTags

        const recipeTimeSubmitted = recipe[7]
        const recipeUsername = recipe[8]
        recipeTemplateCloneOfClone.children[0].querySelector('h6').textContent = `Submitted by ${recipeUsername} on ${recipeTimeSubmitted}`

        const recipeUpvotes = recipe[9]
        recipeTemplateCloneOfClone.children[0].querySelector('.upvote-button-container').querySelector('p').textContent = recipeUpvotes


        const recipeIngredients = recipe[2].split('|')
        let recipeIngredientsString = ''
        for (let i = 0; i < recipeIngredientsCount; i++){
            recipeIngredientsString += `${i + 1}. ${recipeIngredients[i]}\n`
        }
        recipeTemplateCloneOfClone.children[1].children[0].querySelector('p').innerText = recipeIngredientsString

        const recipeInstructions = recipe[4].split('|')
        let recipeInstructionsString = ''
        for (let i = 0; i < recipeInstructionsCount; i++){
            recipeInstructionsString += `${i + 1}. ${recipeInstructions[i]}\n`
        }
        recipeTemplateCloneOfClone.children[1].children[1].querySelector('p').innerText = recipeInstructionsString
        recipeTemplateCloneOfClone.querySelector('.shown-recipe-comments').firstElementChild.remove()


        document.getElementById('all-new-recipes').appendChild(recipeTemplateCloneOfClone)
    }
    recipeTemplate.remove()

    // now render the comments
    for (let comment of recipeData[1]){
        const commentTemplateCloneOfClone = commentTemplateClone.cloneNode(true)

        const commentRecipeID = comment[1]

        const commentText = comment[2]
        commentTemplateCloneOfClone.querySelector('p').innerHTML = commentText

        const commentUsername = comment[3]
        const commentTimeSubmitted = comment[4]
        commentTemplateCloneOfClone.querySelector('h5').innerHTML = `By ${commentUsername} on ${commentTimeSubmitted}:`

        for (let renderedRecipe of document.getElementById('all-new-recipes').children){
            if (renderedRecipe.dataset.recipeID == commentRecipeID){
                // renderedRecipe.querySelector('.shown-recipe-comments').appendChild(commentTemplateCloneOfClone)
                renderedRecipe.querySelector('.shown-recipe-comments').insertBefore(commentTemplateCloneOfClone, renderedRecipe.querySelector('.shown-recipe-comments').querySelector('.submit-comment-box'))
                break
            }
        }
    }
    
    // add comment reader number to all recipes (this is slightly inefficient clientside but its better than making multiple calls to different databases)
    for (let renderedRecipe of document.getElementById('all-new-recipes').children){
        const numerOfComments = renderedRecipe.querySelector('.shown-recipe-comments').children.length - 1
        renderedRecipe.querySelector('.shown-recipe-main-details').children[2].querySelector('p').innerHTML = numerOfComments
    }
    addUIFunctionalityToRecipes()
}

let upvoteDebounceTimer
function addUIFunctionalityToRecipes() {
    let allRecipeExpandables = document.querySelectorAll('.expand-button') //basically this is a communal function for both expand buttons and there is fudging.
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


    // upvote animation and API call
    let allUpvoteButtons = document.querySelectorAll('.upvote-button')
    const addUpvoteEventListener = (e) => {
        if (upvoteDebounceTimer){
            console.log('too soon')
            return
        }
        
        e.target.style.fill = 'var(--colour-2)'
        let upvoteButtonClone = e.target.cloneNode(true)
        upvoteButtonClone.classList.add('upvote-button-ghost')
        upvoteButtonClone.classList.remove('upvote-button')
        e.target.parentElement.appendChild(upvoteButtonClone)

        e.target.removeEventListener('click', addUpvoteEventListener)
        e.target.addEventListener('click', removeUpvoteEventListener)

        setTimeout(() => {
            e.target.parentElement.removeChild(upvoteButtonClone);
        }, 1000)
        
        // send data
        e.target.parentElement.querySelector('p').textContent = Number(e.target.parentElement.querySelector('p').textContent) + 1

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

        upvoteDebounceTimer = setTimeout(() => {
            console.log('waiting 0.5 seconds until next upvote')
            upvoteDebounceTimer = null
        }, 500)
        
    }

    const removeUpvoteEventListener = (e) => {
        if (upvoteDebounceTimer){
            console.log('too soon')
            return
        }

        e.target.style.fill = ''

        e.target.removeEventListener('click', removeUpvoteEventListener)
        e.target.addEventListener('click', addUpvoteEventListener)

        //send data
        e.target.parentElement.querySelector('p').textContent = Number(e.target.parentElement.querySelector('p').textContent) - 1

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

        upvoteDebounceTimer = setTimeout(() => {
            console.log('waiting 0.5 seconds until next upvote')
            upvoteDebounceTimer = null
        }, 500)
    }

    for (let upvoteButton of allUpvoteButtons){
        upvoteButton.addEventListener('click', addUpvoteEventListener)
    }

    let resizeDebounceTimer
    window.addEventListener('resize', (e) => { // fixes height of expanded things if window size changes
        clearTimeout(resizeDebounceTimer)
        resizeDebounceTimer = setTimeout(() => {
            console.log('resize')
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

    //submit comment code
    const allCommentButtons = document.querySelectorAll('.post-comment-button')
    for (let commentButton of allCommentButtons){
        commentButton.addEventListener('click', (e) => {
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

            console.table(commentEntryData)


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
                    commentTemplateCloneOfClone.querySelector('h5').innerHTML = `By ${commentEntryData.username} on ${commentEntryData.timeSubmitted}:`
                    commentTemplateCloneOfClone.querySelector('p').innerHTML = commentEntryData.commentText
                    e.target.parentElement.parentElement.parentElement.insertBefore(commentTemplateCloneOfClone, e.target.parentElement.parentElement)
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
        })
    }

}