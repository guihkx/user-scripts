// ==UserScript==
// @name ProtonMail Signature Remover
// @description Automatically removes email signature for free users of ProtonMail
// @version 2.0.0
// @author guihkx
// @match https://mail.protonmail.com/*
// @run-at document-idle
// @license MIT; https://opensource.org/licenses/MIT
// @namespace https://github.com/guihkx
// @icon https://mail.protonmail.com/assets/coast-228x228.png
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
// @homepageURL https://github.com/guihkx/user-scripts
// @supportURL https://github.com/guihkx/user-scripts/issues
// ==/UserScript==

/**
 * Changelog:
 *
 * @version 2.0.0
 * - Huge code rewrite
 * - Remove support for old.protonmail.com (Sorry!)
 * - Now removes the signature from both HTML and text-based emails (previously it could only do HTML-based ones)
 * - Updated script icon
 *
 * @version 1.0.0:
 * - First release
 */

;(() => {
  let composerContainer

  const id = setInterval(() => {
    composerContainer = document.querySelector('div.composer-container')

    if (composerContainer === null) {
      return
    }
    clearInterval(id)

    log('Ready.')

    const composerContainerMonitor = new MutationObserver(observeComposerContainer)
    composerContainerMonitor.observe(composerContainer, {
      childList: true
    })
  }, 500)

  function observeComposerContainer (mutations) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== 1) {
          continue
        }
        // Determine if this is a text-only email.
        const textareaEmailBody = addedNode.querySelector('textarea[data-testid="squire-textarea"]')

        if (textareaEmailBody !== null) {
          log('A text-only email composer has been rendered.')
          // Although at this point the text-only email composer has been rendered,
          // the textarea that contains the email body will still be empty.
          // As I couldn't figure out a proper way to determine when the textarea has been filled,
          // this ugly, hacky approach keeps monitoring the textarea until its value is not empty anymore.
          removeTextSignature(textareaEmailBody)
          return
        }
        // This is a HTML-based email.
        const composerFrame = addedNode.querySelector('iframe.squireIframe')

        if (composerFrame === null) {
          continue
        }
        log('A HTML email composer has been rendered.')

        // In my tests, this frame's readyState will be set to 'uninitialized' on Firefox.
        // In Chromium-based browsers, it's immediately set to 'complete'.
        if (composerFrame.contentDocument.readyState === 'complete') {
          setupHTMLComposerObserver(composerFrame)
          return
        }
        log('composerFrame\'s readyState is not \'complete\' yet. Listening to DOMContentLoaded.')

        composerFrame.contentWindow.addEventListener('DOMContentLoaded', () => {
          setupHTMLComposerObserver(composerFrame)
        })
        return
      }
    }
  }

  function removeTextSignature (textareaEmailBody) {
    const textSignature = /\n\n^Sent with ProtonMail Secure Email\.$/m

    // Monitors the textarea containing the text-based email body.
    // Runs at every 100ms and stops once the textarea value's is not empty.
    const id = setInterval(() => {
      if (textareaEmailBody.value === '') {
        return
      }
      if (!textSignature.test(textareaEmailBody.value)) {
        clearInterval(id)
        return
      }
      clearInterval(id)

      textareaEmailBody.value = textareaEmailBody.value.replace(textSignature, '')

      // Move the text cursor back to the beginning of the textarea.
      textareaEmailBody.setSelectionRange(0, 0)
    }, 100)
  }

  function setupHTMLComposerObserver (composerFrame) {
    const htmlComposerMonitor = new MutationObserver(observeHTMLComposerBody)
    htmlComposerMonitor.observe(composerFrame.contentDocument.body, {
      childList: true
    })
  }

  function observeHTMLComposerBody (mutations, observer) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== 1) {
          continue
        }
        if (addedNode.id !== 'squire') {
          continue
        }
        // We found our frame, no need to keep observing.
        observer.disconnect()

        const emailBodyMonitor = new MutationObserver(removeHTMLSignature)
        emailBodyMonitor.observe(addedNode, {
          childList: true
        })
        return
      }
    }
  }

  function removeHTMLSignature (mutations, observer) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== 1) {
          continue
        }
        if (!addedNode.classList.contains('protonmail_signature_block')) {
          continue
        }
        observer.disconnect()
        // We already found our signature node, but we need to store it for removal later.
        const signatureNode = addedNode

        // The signature block consists of 3 main nodes:
        //
        // <div><br></div>
        // <div><br></div>
        // <div class="protonmail_signature_block">
        //  <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
        //  <div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com/" target="_blank">ProtonMail</a> Secure Email.</div>
        // </div>
        //
        // The following loop removes the first two blank lines preceding the ProtonMail signature node itself.
        for (let i = 0; i < 2; i++) {
          const prevSiblingNode = signatureNode.previousElementSibling

          if (prevSiblingNode === null || prevSiblingNode.tagName !== 'DIV') {
            break
          }
          const blankLine = prevSiblingNode.firstElementChild

          if (blankLine === null || blankLine.tagName !== 'BR') {
            break
          }
          prevSiblingNode.remove()
        }
        // Finally, remove the signature node itself.
        signatureNode.remove()
        return
      }
    }
  }

  function log () {
    console.log('[ProtonMail Signature Remover]', ...arguments)
  }
})()
