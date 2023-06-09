/*eslint-disable*/
export const hideAlert = () => {
  const el = document.querySelector(`.alert`);
  if (el) el.parentElement.removeChild(el);
};
// a sample html to model our alerts after
// type is either "sucess" or "error"
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class ="alert alert--${type}">${msg}</div>`;
  document.querySelector(`body`).insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
