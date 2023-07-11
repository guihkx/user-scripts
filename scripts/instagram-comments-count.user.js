// ==UserScript==
// @name Instagram Comments Count
// @description Figure out which person has the most comments on a specific Instagram post.
// @version 1.0.0
// @author guihkx
// @match https://www.instagram.com/p/*
// @match https://www.instagram.com/reel/*
// @run-at document-end
// @noframes
// @license MIT; https://opensource.org/licenses/MIT
// @namespace https://github.com/guihkx
// @icon https://www.protondb.com/sites/protondb/images/apple-touch-icon.png
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/instagram-comments-count.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/instagram-comments-count.user.js
// @homepageURL https://github.com/guihkx/user-scripts
// @supportURL https://github.com/guihkx/user-scripts/issues
// ==/UserScript==

/**
 * Changelog:
 *
 * @version 1.0.0:
 * - First release
 */

(async () => {
  'use strict'
  let isRunning = false
  let shouldStop = false
  const LOG = console.log.bind('[Instagram Comments Count]')
  // Left sidebar (vertical)
  LOG('Waiting for vertical sidebar to appear...')
  const verticalSidebar = await lazySelector('div.xh8yej3.x1iyjqo2')
  LOG('Vertical sidebar appeared, appending button...')
  const div = document.createElement('div')
  div.style.textAlign = 'center'
  div.title = 'Load all comments and count them'
  const btn = document.createElement('button')
  btn.textContent = '🟢'
  btn.addEventListener('click', async () => {
    if (isRunning && !shouldStop) {
      LOG('Telling other threads to stop...')
      btn.textContent = '🛑...'
      shouldStop = true
      return
    }
    if (shouldStop) {
      LOG('You already did that. Please wait.')
      return
    }
    btn.textContent = '🛑'
    isRunning = true
    // Keep clicking on the 'load more comments' button until it stops showing
    const loadMoreTimeout = 3 // In seconds
    while (1) {
      if (shouldStop) {
        shouldStop = false
        isRunning = false
        btn.textContent = '🟢'
        return
      }
      try {
        LOG('Waiting for load more comments button to appear...')
        const btnLoadMoreComments = await lazySelector('div._ab8w._ab94._ab99._ab9h._ab9m._ab9p._abcj._abcm > button._abl-', loadMoreTimeout)
        LOG('Button appeared! Clicking...', btnLoadMoreComments)
        btnLoadMoreComments.click()
      } catch (error) {
        LOG(`Button to load more comments hasn't appeared in ${loadMoreTimeout} seconds, finish clicking.`)
        break
      }
    }

    // Load all replies to comments
    LOG('Loading all replies...')
    const btnLoadReplies = document.querySelectorAll('ul._a9yo > li._a9yg > div._ab8w._ab94._ab99._ab9f._ab9k._ab9p._abcm > button._acan._acao._acas._aj1-')
    for (const btn of btnLoadReplies) {
      LOG('btn:', btn)
    }
    // Parse everything
    const comments = []
    const commentList = document.querySelectorAll('ul._a9z6._a9za > ul._a9ym')
    if (!commentList) {
      LOG('Unable to get list of comments')
      shouldStop = false
      isRunning = false
      btn.textContent = '🟢'
      return
    }
    LOG('Total comments:', commentList)
    const commenters = {}
    for (const details of commentList) {
      let author = details.querySelector('div.xt0psk2 > span._aap6._aap7._aap8 > a.x1i10hfl.xjbqb8w')
      if (!author) {
        LOG('Unable to get comment authorship')
        continue
      }
      author = author.textContent
      let comm = details.querySelector('div._a9zs > span._aacl._aaco._aacu._aacx._aad7._aade')
      if (!comm) {
        LOG('Unable to get comment content')
        continue
      }
      comm = comm.innerText
      if (author in commenters) {
        commenters[author].comments.push(comm)
      } else {
        commenters[author] = {
          comments: [comm]
        }
      }
      // const replies = comment.querySelectorAll('')
    }
    for (const commenter in commenters) {
      comments.push({
        author: commenter,
        comments: commenters[commenter].comments
      })
    }
    LOG('Comments:', comments)
    comments.sort((a, b) => {
      return b.comments.length - a.comments.length
    })
    LOG('Sorted comments (from high to low):', comments)

    let out = ''
    let total = 0
    for (const comment of comments) {
      total += comment.comments.length
      out += `@${comment.author} - ${comment.comments.length} ${comment.comments.length > 1 ? 'comentários' : 'comentário'}\n`
    }
    out = `Total comentários: ${total}\n\n---\n\n${out}`
    LOG(out)

    isRunning = false
    shouldStop = false
    btn.textContent = '🟢'
  })
  div.appendChild(btn)
  verticalSidebar.appendChild(div)

  function lazySelector (selector, timeoutSeconds) {
    return new Promise((resolve, reject) => {
      const begin = new Date() / 1000
      const id = setInterval(() => {
        const element = document.querySelector(selector)
        if (element) {
          clearInterval(id)
          resolve(element)
          return
        }
        if (((new Date() / 1000) - begin) >= timeoutSeconds) {
          reject(new Error(`Timeout of ${timeoutSeconds} seconds has expired`))
        }
      }, 500)
    })
  }

  /*
  async function sleep (seconds) {
    return new Promise(resolve => {
      const id = setTimeout(() => {
        clearTimeout(id)
        resolve(true)
      }, seconds * 1000)
    })
  }
  */
})()
