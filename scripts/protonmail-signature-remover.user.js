// ==UserScript==
// @name Proton Mail Signature Remover
// @description Automatically removes email signature for free users of Proton Mail
// @version 2.0.4
// @author guihkx
// @match https://mail.protonmail.com/*
// @match https://mail.proton.me/*
// @run-at document-idle
// @license MIT; https://opensource.org/licenses/MIT
// @namespace https://github.com/guihkx
// @icon https://mail.proton.me/assets/favicon-48x48.png
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/protonmail-signature-remover.user.js
// @homepageURL https://github.com/guihkx/user-scripts
// @supportURL https://github.com/guihkx/user-scripts/issues
// @noframes
// ==/UserScript==

/**
 * Changelog:
 *
 * @version 2.0.4
 * - Fix compatibility with Proton Mail v5.0.10.
 * - Prevent script from running twice due to nested frames.
 *
 * @version 2.0.3
 * - Fixed signature in text-mode editor, again (why do they keep changing it?)
 * - Added support for their new domain (mail.proton.me)
 * - Updated @icon metadata
 * - Replaced 'ProtonMail' by 'Proton Mail'
 *
 * @version 2.0.2
 * - Updated a bunch of class names, so now the script should work again.
 * - Fixed signature detection in the text-only editor.
 *
 * @version 2.0.1
 * - Fixed signature not being removed in the HTML composer ("rich text editor").
 * - Added logging for when a signature is found and removed.
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
  const log = console.log.bind(console, '[Proton Mail Signature Remover]')

  log('Waiting for the composer container...')

  const id = setInterval(() => {
    const composerContainer = document.querySelector('div.app-root > div:not([class]):last-child')

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
        const textareaEmailBody = addedNode.querySelector('textarea[data-testid="editor-textarea"]')

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
        const composerFrame = addedNode.querySelector('iframe.flex-item-fluid')

        if (composerFrame === null) {
          continue
        }
        composerFrame.addEventListener('load', () => {
          log('A HTML email composer has been rendered.')

          const roosterEditor = composerFrame.contentDocument.getElementById('rooster-editor')

          if (!roosterEditor) {
            log('Fatal: `rooster-editor` was not found.')
            return
          }
          const signatureNode = roosterEditor.querySelector('div.protonmail_signature_block')

          if (signatureNode) {
            // Signature node has been already rendered, remove it directly.
            removeHTMLSignature(signatureNode)
          } else {
            // Signature node hasn't been rendered yet, so monitor it.
            setupHTMLComposerObserver(roosterEditor)
          }
        })
        return
      }
    }
  }

  function removeTextSignature (textareaEmailBody) {
    const textSignature = /\n\n^Sent with Proton Mail secure email\.$/m

    // Monitors the textarea containing the text-based email body.
    // Runs at every 100ms and stops once the textarea's value is not empty.
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
      log('Signature successfully removed from text-only email.')

      // Move the text cursor back to the beginning of the textarea.
      textareaEmailBody.setSelectionRange(0, 0)
    }, 100)
  }

  function setupHTMLComposerObserver (roosterEditor) {
    const htmlComposerMonitor = new MutationObserver(detectHTMLSignatureNode)
    htmlComposerMonitor.observe(roosterEditor, {
      childList: true
    })
  }

  function detectHTMLSignatureNode (mutations, observer) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== 1) {
          continue
        }
        if (!addedNode.classList.contains('protonmail_signature_block')) {
          continue
        }
        // Found the signature node, stop observing and remove it.
        observer.disconnect()
        removeHTMLSignature(addedNode)
        return
      }
    }
  }

  function removeHTMLSignature (signatureNode) {
    // The signature block consists of 3 main nodes:
    //
    // <div><br></div>
    // <div><br></div>
    // <div class="protonmail_signature_block">
    //  <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
    //  <div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com/" target="_blank">ProtonMail</a> Secure Email.</div>
    // </div>
    //
    // The following loop removes the first two blank lines preceding the Proton Mail signature node itself.
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
    log('Signature successfully removed from HTML email.')
  }
})()
