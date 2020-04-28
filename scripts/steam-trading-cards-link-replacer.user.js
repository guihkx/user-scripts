// ==UserScript==
// @name Steam Trading Cards Link Replacer
// @description Replaces the "Steam Trading Cards" link in the Steam Store with a link to the actual list of trading cards in the Steam Market
// @version 1.0.0
// @author guihkx
// @match https://store.steampowered.com/app/*
// @license MIT; https://opensource.org/licenses/MIT
// @run-at document-idle
// @namespace https://github.com/guihkx
// @icon https://steamcommunity-a.akamaihd.net/economy/emoticonlarge/tradingcard
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/steam-trading-cards-link-replacer.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/steam-trading-cards-link-replacer.user.js
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

  const tCardsSection = document.querySelector(
    '#category_block img.category_icon[src*="ico_cards.png"]'
  )

  if (tCardsSection === null) {
    return
  }
  const appId = window.location.pathname.split('/')[2]
  const tCardsLink =
    tCardsSection.parentElement.parentElement.nextElementSibling

  const marketUrl = new URL('https://steamcommunity.com/market/search')
  marketUrl.searchParams.set('appid', '753')
  marketUrl.searchParams.set('category_753_Game[]', `tag_app_${appId}`)
  marketUrl.searchParams.set('category_753_item_class[]', 'tag_item_class_2')
  marketUrl.searchParams.set('q', '')
  marketUrl.hash = '#p1_name_asc'

  tCardsLink.href = marketUrl
  tCardsLink.target = '_blank'
})()
