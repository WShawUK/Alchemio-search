import { searchAndReceiveRecipes } from "./search-and-render-script.js"
import { renderRecipeData } from './search-and-render-script.js'
import { renderCommentData } from './search-and-render-script.js'

import { addExpandableButtonUI } from './UI-script.js'
import { windowResizeEvent } from './UI-script.js'
import { submitCommentEvent } from './UI-script.js'
import { upvoteEvent } from './UI-script.js'

//nav redirect
document.getElementById('nav-div').firstElementChild.children[1].addEventListener('click', () => {
    window.location = 'https://wshawuk.github.io/Alchemio-search/'
})
document.getElementById('nav-div').firstElementChild.children[0].addEventListener('click', () => {
    window.location = 'https://wshawuk.github.io/Alchemio/'
})

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
    limitSliderReader.textContent = `Show ${limitSlider.value} recipes`
})

//must load all newly added recipes BEFORE adding the button expand stuff

const recipeTemplate = document.querySelector('.shown-recipe')
const recipeTemplateClone = recipeTemplate.cloneNode(true)
recipeTemplateClone.style.display = 'block'
const commentTemplate = document.querySelector('.recipe-comment')
const commentTemplateClone = commentTemplate.cloneNode(true)


//initial receive recent recipes code
async function afterReceivingSearchData() {
    const receivedData = await searchAndReceiveRecipes(sortDirectionIsAscending, currentSortOption)

    if (receivedData == 'search returned nothing'){
        document.getElementById('new-recipes-div').querySelector('h3').innerHTML = 'No results found'
        setTimeout(() => {
            document.getElementById('new-recipes-div').querySelector('h3').innerHTML = 'Search results:'
        }, 2000);
    }
    else  if (receivedData){ // now render all UI elements, imported from UI-script.js
        renderRecipeData(receivedData)
        renderCommentData(receivedData)

        addExpandableButtonUI()
        windowResizeEvent()
        const allCommentButtons = document.querySelectorAll('.post-comment-button')
        for (let commentButton of allCommentButtons){
            commentButton.addEventListener('click', submitCommentEvent)
        }

        const allUpvoteButtons = document.querySelectorAll('.upvote-button')
        for (let upvoteButton of allUpvoteButtons){
            upvoteButton.addEventListener('click', upvoteEvent)
        }
    }
}

document.getElementById('search-button').addEventListener('click', afterReceivingSearchData)