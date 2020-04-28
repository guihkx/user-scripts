// ==UserScript==
// @name YouTube URL Tracker Remover
// @description Fixes user-tracking links in the description of YouTube videos
// @version 1.0.0
// @author guihkx
// @match https://*.youtube.com/*
// @license MIT; https://opensource.org/licenses/MIT
// @run-at document-idle
// @noframes
// @namespace https://github.com/guihkx
// @icon https://s.ytimg.com/yts/img/favicon_48-vflVjB_Qk.png
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/youtube-url-tracker-remover.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/youtube-url-tracker-remover.user.js
// @homepageURL https://github.com/guihkx/user-scripts
// @supportURL https://github.com/guihkx/user-scripts/issues
// ==/UserScript==

/**
 * Changelog:
 *
 * @version 1.0.0:
 * - First release
 */

;(() => {
  'use strict'

  const legacyDescSelector = 'p#eow-description'
  const legacyDescNode = document.querySelector(legacyDescSelector)

  let eventName
  let isLegacy
  let descriptionSelector

  if (legacyDescNode !== null) {
    // We're on the legacy design of YouTube.
    //
    // The legacy design can be manually enabled by either:
    // * Appending "&disable_polymer=1" to the URL of a video
    // * Adding "f6=8" or "f6=9" to the "PREF" YouTube cookie
    isLegacy = true
    eventName = 'spfdone'
    descriptionSelector = legacyDescSelector
  } else {
    // 'New' YouTube
    eventName = 'yt-page-data-updated'
    descriptionSelector = '#description yt-formatted-string'
  }

  document.addEventListener(eventName, () => {
    log('Event called:', eventName)

    const descriptionNode = document.querySelector(descriptionSelector)

    if (descriptionNode === null) {
      log('NULL description node. Not on a video page?')
      return
    }
    removeYoutubeTracking(descriptionNode)
  })

  if (isLegacy) {
    // On legacy YouTube, the spfdone event isn't called after the page
    // has rendered for the first time, so we manually trigger it.
    document.dispatchEvent(new Event(eventName))
  }

  function removeYoutubeTracking (descriptionNode) {
    const descLinks = descriptionNode.getElementsByTagName('a')

    for (const aTag of descLinks) {
      const rawUrl = aTag.href

      // Ignore timestamps
      if (+aTag.textContent[0] >= 0) {
        continue
      }
      // Ignore hashtags
      if (aTag.textContent[0] === '#') {
        continue
      }
      // Ignore URLs within the youtube.com domain
      if (aTag.pathname !== '/redirect') {
        aTag.textContent = rawUrl
        continue
      }
      const actualUrl = getQueryString('q', aTag)

      if (actualUrl === null) {
        log('Unable to extract URL from /redirect: ', aTag)
        continue
      }
      aTag.href = actualUrl
      aTag.textContent = actualUrl
    }
  }

  function getQueryString (name, aTag) {
    const qsRegEx = new RegExp(`[?&]${name}=([^&#]*)`)
    const matches = aTag.search.match(qsRegEx)

    return matches === null ? null : decodeURIComponent(matches[1])
  }

  function log () {
    console.log('[YouTube URL Tracker Remover]', ...arguments)
  }
})()
