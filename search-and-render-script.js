//must load all newly added recipes BEFORE adding the button expand stuff
const recipeTemplate = document.querySelector('.shown-recipe')
const recipeTemplateClone = recipeTemplate.cloneNode(true)
recipeTemplateClone.style.display = 'block'
const commentTemplate = document.querySelector('.recipe-comment')
const commentTemplateClone = commentTemplate.cloneNode(true)


//initial receive recent recipes code
export function receiveRecentRecipes() {
    let searchDataToSend = {
        type : 'search',
        searchTerms : [],
        sort : 'id',
        sortDirection : 'DESC',
        numberToReceive : 10
    }

    // begin API call
    const APIFetch = fetch('https://tjjte32ws4pvoihteuzode4k2u0jwupu.lambda-url.eu-north-1.on.aws/', {
    method: 'POST',
    body: JSON.stringify(searchDataToSend)
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

    return new Promise(resolve => { // gives the json to afterReceivingSearchData in main-script.js
        resolve(APIFetchJSON)
    })
}



export function searchAndReceiveRecipes(sortDirectionIsAscending, currentSortOption) {
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

    return new Promise(resolve => { // gives the json to afterReceivingSearchData in browse-main-script.js
        resolve(APIFetchJSON)
    })
}


export function renderRecipeData(recipeData){
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
}

export function renderCommentData(recipeData) {
    for (let comment of recipeData[1]){
        const commentTemplateCloneOfClone = commentTemplateClone.cloneNode(true)

        const commentRecipeID = comment[1]

        const commentText = comment[2]
        commentTemplateCloneOfClone.querySelector('p').textContent = commentText

        const commentUsername = comment[3]
        const commentTimeSubmitted = comment[4]
        commentTemplateCloneOfClone.querySelector('h5').textContent = `By ${commentUsername} on ${commentTimeSubmitted}:`

        for (let renderedRecipe of document.getElementById('all-new-recipes').children){
            if (renderedRecipe.dataset.recipeID == commentRecipeID){
                renderedRecipe.querySelector('.shown-recipe-comments').insertBefore(commentTemplateCloneOfClone, renderedRecipe.querySelector('.shown-recipe-comments').querySelector('.submit-comment-box'))
                break
            }
        }
    }
    
    // add comment reader number to all recipes (this is slightly inefficient clientside but its better than making multiple calls to different databases)
    for (let renderedRecipe of document.getElementById('all-new-recipes').children){
        const numerOfComments = renderedRecipe.querySelector('.shown-recipe-comments').children.length - 1
        renderedRecipe.querySelector('.shown-recipe-main-details').children[2].querySelector('p').textContent = numerOfComments
    }
}