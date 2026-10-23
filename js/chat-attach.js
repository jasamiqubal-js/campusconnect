/* chat-attach.js: photos and small files in chat messages */
let PENDING_ATTACH = null; // the attachment chosen for the next message

function attachBtnHTML() {
  return `<label class="chat-attach btn btn-light border mb-0" title="Attach a photo or file">
    <i class="fa-solid fa-paperclip"></i>
    <input type="file" class="visually-hidden" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt" onchange="pickAttachment(this)"></label>`;
}

async function pickAttachment(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  try {
    if (f.type.startsWith('image/')) {
      const url = await DB.shrink(f, 900, 0.7);
      if (url.length > 780000) throw new Error('This photo is too large. Please choose a smaller one.');
      PENDING_ATTACH = { image: url };
      toast('Photo ready. Press send.', 'info');
    } else {
      if (f.size > 600 * 1024) throw new Error('This file is too large (max 600 KB). Upload it to Google Drive and send the link instead.');
      const url = await DB.readAsDataUrl(f);
      PENDING_ATTACH = { file: url, fileName: f.name };
      toast(`File ready: ${f.name}. Press send.`, 'info');
    }
  } catch (e) {
    PENDING_ATTACH = null;
    toast(e.message, 'error');
  }
  input.value = '';
}

// What one message bubble shows for its attachment
function attachHTML(m) {
  if (m.image) return `<img class="chat-img" src="${m.image}" alt="Photo" loading="lazy">`;
  if (m.file) return `<a class="chat-file-link" href="${m.file}" download="${esc(m.fileName || 'file')}"><i class="fa-regular fa-file me-1"></i>${esc(m.fileName || 'File')}</a>`;
  return '';
}
