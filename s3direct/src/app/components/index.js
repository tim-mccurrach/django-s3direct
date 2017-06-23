import {removeUpload, getUploadURL, clearErrors, updateProgress} from '../actions';
import {getFilename, getUrl, getError, getUploadProgress} from '../store';
import {observeStore, raiseEvent} from '../utils';


const View = function(element, store) {
    return {
        renderFilename: function() {
            const filename = getFilename(store),
                url = getUrl(store);

            if (filename && url) {
                this.$link.innerHTML = filename;
                this.$link.setAttribute('href', url);
                this.$url.value = url.split("?")[0];

                this.$element.classList.add('link-active');
                this.$element.classList.remove('form-active');
            }
            else {
                this.$url.value = '';
                this.$input.value = '';

                this.$element.classList.add('form-active');
                this.$element.classList.remove('link-active');
            }
        },

        renderError: function() {
            const error = getError(store);

            if (error) {
                this.$element.classList.add('has-error');
                this.$element.classList.add('form-active');
                this.$element.classList.remove('link-active');

                this.$element.querySelector('.file-input').value = '';
                this.$element.querySelector('.error').innerHTML = error;
            }
            else {
                this.$element.classList.remove('has-error');
                this.$element.querySelector('.error').innerHTML = '';
            }
        },

        renderUploadProgress: function() {
            const uploadProgress = getUploadProgress(store);

            if (uploadProgress && uploadProgress < 100) {
                this.$element.classList.add('progress-active');
                this.$bar.style.width = uploadProgress + '%';
            }
            else {
                this.$element.classList.remove('progress-active');
                this.$bar.style.width = '0';
            }
        },

        removeUpload: function(event) {
            event.preventDefault();

            store.dispatch(updateProgress());
            store.dispatch(removeUpload());
            raiseEvent(this.$element, 's3uploads:clear-upload');
        },

        getUploadURL: function(event) {
            const file = this.$input.files[0],
                dest = this.$dest.value,
                url  = this.$element.getAttribute('data-policy-url');

            store.dispatch(clearErrors());
            store.dispatch(getUploadURL(file, dest, url, store));
        },

        init: function() {
            // cache all the query selectors
            // $variables represent DOM elements
            this.$element = element;
            this.$url     = element.querySelector('.file-url');
            this.$input   = element.querySelector('.file-input');
            this.$remove  = element.querySelector('.file-remove');
            this.$dest    = element.querySelector('.file-dest');
            this.$link    = element.querySelector('.file-link');
            this.$error   = element.querySelector('.error');
            this.$bar     = element.querySelector('.bar');

            // set initial DOM state
            const status = (this.$url.value === '') ? 'form' : 'link';
            this.$element.className = 's3direct ' + status + '-active'

            // add event listeners
            this.$remove.addEventListener('click', this.removeUpload.bind(this))
            this.$input.addEventListener('change', this.getUploadURL.bind(this))

            // these three observers subscribe to the store, but only trigger their
            // callbacks when the specific piece of state they observe changes.
            // this allows for a less naive approach to rendering changes than a
            // render method subscribed to the whole state.
            const filenameObserver = observeStore(store, state => state.appStatus.filename, this.renderFilename.bind(this));

            const errorObserver = observeStore(store, state => state.appStatus.error, this.renderError.bind(this));

            const uploadProgressObserver = observeStore(store, state => state.appStatus.uploadProgress, this.renderUploadProgress.bind(this));
        }
    }
}

export {View};