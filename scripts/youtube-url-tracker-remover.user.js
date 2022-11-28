// ==UserScript==
// @name YouTube URL Tracker Remover
// @description Fixes user-tracking links in the description of YouTube videos
// @version 1.2.0
// @author guihkx
// @match https://*.youtube.com/*
// @license MIT; https://opensource.org/licenses/MIT
// @run-at document-start
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
 * @version 1.2.0
 * - Fix compatibility issues with latest YouTube changes
 * - Add support for YouTube Shorts
 * - Major code refactor
 *
 * @version 1.1.2
 * - Fix script sometimes not injecting on Firefox with Violentmonkey
 *
 * @version 1.1.1:
 * - Fix wrong selector
 *
 * @version 1.1.0:
 * - Remove support for legacy YouTube (Polymer)
 *
 * @version 1.0.0:
 * - First release
 */

;(() => {
  'use strict'

  const log = console.log.bind(console, '[YouTube URL Tracker Remover]')

  const ytEvents = [
    // Triggered when the page is updated somehow, e.g. by clicking on another video.
    'yt-page-data-updated',
    // Triggered when the 'Show less' text under the description is clicked.
    'yt-text-inline-expander-collapse-clicked',
    // Triggered when the 'Show more' text under the description is clicked.
    'yt-text-inline-expander-expand-clicked'
  ]

  const ytShortsEvents = [
    // Triggered when you open the description box on YouTube Shorts.
    'yt-popup-opened'
  ];

  [...ytEvents, ...ytShortsEvents].forEach(event => {
    document.addEventListener(event, async e => {
      const isRegularVideo = window.location.pathname === '/watch'
      const isShorts = window.location.pathname.startsWith('/shorts/')

      if ((isRegularVideo && ytShortsEvents.includes(e.type)) || (isShorts && ytEvents.includes(e.type))) {
        log(`YouTube event triggered: ${e.type}. Ignoring it because it's not useful on this page.`)
        return
      }
      try {
        const selector = isRegularVideo ? '#description-inline-expander a' : '#description a'
        removeYoutubeTracking(await querySelectorAllLazy(selector))
      } catch (error) {
        log('Error: Unable to find links in the video description.\n' +
            'Underlying error: ' + error + '\n' +
            'Possible reasons:\n' +
            '- There are currently no links in the video description.\n' +
            '- The script is broken (please open a bug report).')
      }
    })
  })

  function querySelectorAllLazy (selector, intervalMs = 500, maxTries = 6) {
    return new Promise((resolve, reject) => {
      let tried = 1
      const id = setInterval(() => {
        if (tried > maxTries) {
          clearInterval(id)
          reject(new Error(`The maximum amount of tries (${maxTries}) was exceeded.`))
          return
        }
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          clearInterval(id)
          resolve(elements)
          return
        }
        tried++
      }, intervalMs)
    })
  }

  function removeYoutubeTracking (links) {
    let cleanedUpLinks = 0
    for (const link of links) {
      // Ignore timestamps
      if (+link.textContent[0] >= 0) {
        continue
      }
      // Ignore hashtags
      if (link.textContent[0] === '#') {
        continue
      }
      // Ignore mentions
      if (link.textContent[0] === '@') {
        continue
      }
      // Ignore URLs within the youtube.com domain
      if (link.pathname !== '/redirect') {
        continue
      }
      const actualUrl = new URLSearchParams(link.search).get('q')

      if (actualUrl === null) {
        log('Unable to extract URL from /redirect:', link)
        continue
      }
      link.href = actualUrl
      cleanedUpLinks++
    }
    if (cleanedUpLinks > 0) {
      log(`Cleaned up ${cleanedUpLinks} links in the video description.`)
    }
  }
})()
