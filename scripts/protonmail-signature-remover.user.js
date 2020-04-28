// ==UserScript==
// @name ProtonMail Signature Remover
// @description Automatically removes email signature for free users of ProtonMail
// @version 1.0.0
// @author guihkx
// @match https://beta.protonmail.com/*
// @match https://mail.protonmail.com/*
// @match https://old.protonmail.com/*
// @run-at document-idle
// @license MIT; https://opensource.org/licenses/MIT
// @namespace https://github.com/guihkx
// @icon https://mail.protonmail.com/assets/favicons/favicon-96x96.png
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
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
  let composerForm

  log('Waiting for composer form...')

  const id = setInterval(() => {
    composerForm = document.querySelector('form#pm_composer')

    if (composerForm === null) {
      return
    }
    clearInterval(id)

    log('Composer form found!')

    const composerMonitor = new MutationObserver(observeComposer)
    composerMonitor.observe(composerForm, {
      childList: true
    })
  }, 500)

  function observeComposer (mutations) {
    for (const mutation of mutations) {
      const removedNodes = mutation.removedNodes

      for (let n = 0; n < removedNodes.length; n++) {
        if (removedNodes[n].nodeType !== 1) {
          continue
        }
        if (!removedNodes[n].classList.contains('composer-container')) {
          continue
        }
        log('Email composer dialog got removed.')
        return
      }
    }
    log('Email composer dialog got rendered.')

    const squireIframe = composerForm.querySelector('iframe.squireIframe')

    if (squireIframe === null) {
      log('BUG: Unable to find `squireIframe`! Please report this.')
      return
    }
    const composerBodyMonitor = new MutationObserver(observeComposerBody)
    composerBodyMonitor.observe(squireIframe.contentDocument.body, {
      childList: true
    })
  }

  function observeComposerBody (mutations, observer) {
    observer.disconnect()

    for (const mutation of mutations) {
      const addedNodes = mutation.addedNodes

      for (let n = 0; n < addedNodes.length; n++) {
        if (addedNodes[n].nodeType !== 1) {
          continue
        }
        if (!addedNodes[n].classList.contains('protonmail_signature_block')) {
          continue
        }
        // The signature block is currently made of 3 nodes:
        // <div><br></div>
        // <div><br></div>
        // <div class="protonmail_signature_block">Sent with ProtonMail Secure Email</div>
        for (let i = 0; i < 2; i++) {
          const siblingNode = addedNodes[n].previousElementSibling

          if (siblingNode === null || siblingNode.tagName !== 'DIV') {
            break
          }
          const blankLine = siblingNode.firstElementChild

          if (blankLine === null || blankLine.tagName !== 'BR') {
            break
          }
          log('Removing blank line', i + 1)
          siblingNode.remove()
        }
        log('Removing signature node.')
        addedNodes[n].remove()

        return
      }
    }
  }

  function log () {
    console.log('[ProtonMail Signature Remover]', ...arguments)
  }
})()
