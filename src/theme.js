// credits for the folder images code: harbassan
(function bloom() {
  function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
      func();
    } else if (timeout > 0) {
      setTimeout(waitForElement, 300, els, func, timeout - 1);
    }
  }

  function updatePlaylistsImages() {
    waitForElement(['.main-rootlist-rootlistItem'], () => {
      const mainRootlistWrapper = document.getElementsByClassName('main-rootlist-wrapper')[0];
      mainRootlistWrapper.style.height = `${mainRootlistWrapper.offsetHeight * 2}px`;
      const cache = new Map();

      async function fetchPlaylistData(url) {
        const response = await Spicetify.CosmosAsync.get(url);
        const { items, next } = response;
        return [...items, ...(next ? await fetchPlaylistData(next) : [])];
      }

      async function addPlaylistIcons() {
        while (!Spicetify || !Spicetify.Platform || !Spicetify.CosmosAsync) {
          // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        async function updatePlaylistList(playlistData) {
          const playlistElements = await new Promise((resolve) => {
            const interval = setInterval(() => {
              const elements = document.querySelectorAll('#spicetify-playlist-list li a');
              if (elements.length > 0) {
                clearInterval(interval);
                resolve(Array.from(elements));
              }
            }, 100);
          });

          for (let i = 0; i < playlistElements.length; i += 1) {
            const [id] = playlistElements[i].href.split('/').slice(-1);
            const [type] = playlistElements[i].href.split('/').slice(-2, -1);
            let icon = cache.get(id);
            if (!icon) {
              let base64;
              switch (type) {
                case 'playlist': {
                  const playlist = playlistData.find((p) => p.id === id);
                  const image = playlist ? playlist.images[0] || {} : {};
                  icon = {
                    src:
                      image.url ||
                      'https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_music_note_2_24_filled.svg',
                    size: 'cover',
                  };
                  if (!image.url) {
                    icon.size = '45px';
                  }
                  cache.set(id, icon);
                  break;
                }

                case 'folder':
                  base64 = localStorage.getItem(`bloom:folder-image:${id}`);
                  icon = {
                    src:
                      base64 ||
                      'https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_folder_24_filled.svg',
                    size: 'cover',
                  };
                  if (!base64) {
                    icon.size = '45px';
                  }
                  cache.set(id, icon);
                  break;

                default:
                  break;
              }
            }

            if (icon.src) {
              playlistElements[i].style.backgroundImage = `url('${icon.src}')`;
              playlistElements[i].style.backgroundRepeat = 'no-repeat';
              playlistElements[i].style.backgroundSize = `${icon.size}`;
              playlistElements[i].style.backgroundPosition = 'center';
            }
          }
        }

        const playlistList = await new Promise((resolve) => {
          const interval = setInterval(() => {
            const element = document.getElementById('spicetify-playlist-list');
            if (element) {
              clearInterval(interval);
              resolve(element);
            }
          }, 100);
        });

        const playlistData = await fetchPlaylistData(
          'https://api.spotify.com/v1/me/playlists?limit=50'
        );
        const observer = new MutationObserver(async () => {
          observer.disconnect();
          await updatePlaylistList(playlistData);
          observer.observe(playlistList, { childList: true, subtree: true });
        });
        await updatePlaylistList(playlistData);
        observer.observe(playlistList, { childList: true, subtree: true });
      }

      addPlaylistIcons();
    });
  }
  updatePlaylistsImages();

  waitForElement(['.main-navBar-navBarLink'], () => {
    const navBarItems = document.getElementsByClassName('main-navBar-navBarLink');
    for (let i = 0; i < navBarItems.length; i += 1) {
      const div = document.createElement('div');
      div.classList.add('navBar-navBarLink-accent');
      navBarItems[i].appendChild(div);
    }
  });

  waitForElement(['.main-yourLibraryX-navItem'], () => {
    const navItemsLibraryX = document.getElementsByClassName('main-yourLibraryX-navLink');
    for (let i = 0; i < navItemsLibraryX.length; i += 1) {
      const div = document.createElement('div');
      div.classList.add('main-yourLibraryX-navLink-accent');
      navItemsLibraryX[i].appendChild(div);
    }
  });

  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--spice-text');
  if (textColor === ' #000000') {
    document.documentElement.style.setProperty('--filter-brightness', 0);
  }

  const interval = setInterval(() => {
    if (
      typeof Spicetify.Platform === 'undefined' ||
      (typeof Spicetify.Platform.Translations.play === 'undefined' &&
        typeof Spicetify.Platform.Translations.pause === 'undefined')
    )
      return;
    clearInterval(interval);
    const playButtonStyle = document.createElement('style');

    function cleanLabel(label) {
      const cleanedLabel = label.replace(/[{0}{1}«»”“]/g, '').trim();
      return cleanedLabel;
    }

    let playlistPlayLabel = Spicetify.Platform.Translations['playlist.a11y.play'];
    playlistPlayLabel = cleanLabel(playlistPlayLabel);
    let playlistPauseLabel = Spicetify.Platform.Translations['playlist.a11y.pause'];
    playlistPauseLabel = cleanLabel(playlistPauseLabel);

    const tracklistPlayLabel = Spicetify.Platform.Translations['tracklist.a11y.play'];
    let tracklistPlayLabelOne;
    let tracklistPlayLabelTwo;
    // eslint-disable-next-line no-underscore-dangle
    if (['zh-CN', 'zh-TW', 'am', 'fi'].includes(Spicetify.Locale._locale)) {
      [tracklistPlayLabelOne, tracklistPlayLabelTwo] = tracklistPlayLabel.split('{1}');
    } else {
      [tracklistPlayLabelOne, tracklistPlayLabelTwo] = tracklistPlayLabel.split('{0}');
    }
    tracklistPlayLabelOne = cleanLabel(tracklistPlayLabelOne);
    tracklistPlayLabelTwo = cleanLabel(tracklistPlayLabelTwo);

    playButtonStyle.innerHTML = `
      .main-playButton-button[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-playButton-PlayButton>button[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations.play}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations['playback-control.play']}"],
      .main-trackList-rowPlayPauseButton[aria-label*="${Spicetify.Platform.Translations.play}"],
      .main-trackList-rowImagePlayButton[aria-label*="${tracklistPlayLabelOne}"][aria-label*="${tracklistPlayLabelTwo}"],
      .main-playButton-PlayButton>button[aria-label*="${playlistPlayLabel}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_play_24_filled.svg') !important;
      }
      .main-playButton-button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playButton-PlayButton>button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playPauseButton-button[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playPauseButton-button[aria-label="${Spicetify.Platform.Translations['playback-control.pause']}"],
      .main-trackList-rowPlayPauseButton[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-trackList-rowImagePlayButton[aria-label*="${Spicetify.Platform.Translations.pause}"],
      .main-playButton-PlayButton>button[aria-label*="${playlistPauseLabel}"] {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_pause_16_filled.svg') !important;
      }`;
    document.getElementsByTagName('head')[0].appendChild(playButtonStyle);

    const libraryXButtonsStyle = document.createElement('style');
    libraryXButtonsStyle.innerHTML = `
      .main-yourLibraryX-button[aria-label*="${Spicetify.Platform.Translations['web-player.your-library-x.enlarge-your-library']}"] span {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_arrow_right_24_filled.svg') !important;
        width: 18px;
        height: 18px;
      }
      .main-yourLibraryX-button[aria-label*="${Spicetify.Platform.Translations['web-player.your-library-x.reduce-your-library']}"] span {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_arrow_left_24_filled.svg') !important;
        width: 18px;
        height: 18px;
      }
      .main-yourLibraryX-button[aria-label*="${Spicetify.Platform.Translations['web-player.your-library-x.grid-view']}"] span {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_table_simple_24_regular.svg') !important;
        width: 18px;
        height: 18px;
      }
      .main-yourLibraryX-button[aria-label*="${Spicetify.Platform.Translations['web-player.your-library-x.list-view']}"] span {
        background-color: var(--spice-text) !important;
        -webkit-mask-image: url('https://nimsandu.github.io/spicetify-bloom/assets/fluentui-system-icons/ic_fluent_text_bullet_list_ltr_24_filled.svg') !important;
        width: 18px;
        height: 18px;
      }
    `;
    document.getElementsByTagName('head')[0].appendChild(libraryXButtonsStyle);
  }, 10);

  // fixes container shifting & active line clipping
  function updateLyricsPageProperties() {
    function detectTextDirection() {
      // 0, 1 - blank lines
      const lyric = document.getElementsByClassName('lyrics-lyricsContent-lyric')[2];
      // https://stackoverflow.com/questions/13731909/how-to-detect-that-text-typed-in-text-area-is-rtl
      const rtlRegExp = /[\u0591-\u07FF]/;
      return rtlRegExp.test(lyric.innerHTML) ? 'rtl' : 'ltr';
    }

    function setLyricsTransformOrigin(textDirection) {
      const rootStyle = document.documentElement.style;
      if (textDirection === 'rtl') {
        rootStyle.setProperty('--lyrics-text-direction', 'right');
      } else {
        rootStyle.setProperty('--lyrics-text-direction', 'left');
      }
    }

    function calculateLyricsMaxWidth(textDirection, lyricsWrapper, lyricsContainer) {
      let offset;
      let maxWidth;

      if (textDirection === 'rtl') {
        offset =
          lyricsWrapper.offsetRight +
          parseInt(window.getComputedStyle(lyricsWrapper).marginRight, 10);
        maxWidth = Math.round(0.95 * (lyricsContainer.clientWidth - offset));
      } else {
        offset =
          lyricsWrapper.offsetLeft +
          parseInt(window.getComputedStyle(lyricsWrapper).marginLeft, 10);
        maxWidth = Math.round(0.95 * (lyricsContainer.clientWidth - offset));
      }

      return maxWidth;
    }

    function lockLyricsWrapperWidth(lyricsWrapper) {
      const lyricsWrapperWidth = lyricsWrapper.getBoundingClientRect().width;
      // eslint-disable-next-line no-param-reassign
      lyricsWrapper.style.maxWidth = `${lyricsWrapperWidth}px`;
      // eslint-disable-next-line no-param-reassign
      lyricsWrapper.style.width = `${lyricsWrapperWidth}px`;
    }

    function revealLyricsLines() {
      const lyricsLines = document.getElementsByClassName('lyrics-lyricsContent-lyric');
      let positionIndex = 0;
      for (let i = 0; i < lyricsLines.length; i += 1) {
        if (lyricsLines[i].innerHTML !== '') {
          positionIndex += 1;
        }

        let animationDelay = 50 + positionIndex * 10;
        if (animationDelay > 1000) {
          animationDelay = 1000;
        }

        let animationDuration = 200 + positionIndex * 75;
        if (animationDuration > 1000) {
          animationDuration = 1000;
        }

        lyricsLines[i].style.animationDelay = `${animationDelay}ms`;
        lyricsLines[i].style.animationDuration = `${animationDuration}ms`;
        lyricsLines[i].style.animationTimingFunction = 'ease';
        lyricsLines[i].style.animationName = 'reveal';
      }
    }

    function setLyricsPageProperties() {
      const lyricsContentWrapper = document.getElementsByClassName(
        'lyrics-lyrics-contentWrapper'
      )[0];
      const lyricsContentContainer = document.getElementsByClassName(
        'lyrics-lyrics-contentContainer'
      )[0];

      lyricsContentWrapper.style.maxWidth = '';
      lyricsContentWrapper.style.width = '';

      const lyricsTextDirection = detectTextDirection();
      setLyricsTransformOrigin(lyricsTextDirection);
      const lyricsMaxWidth = calculateLyricsMaxWidth(
        lyricsTextDirection,
        lyricsContentWrapper,
        lyricsContentContainer
      );
      lyricsContentWrapper.style.setProperty('--lyrics-active-max-width', `${lyricsMaxWidth}px`);
      lockLyricsWrapperWidth(lyricsContentWrapper);
    }

    async function lyricsCallback(mutationsList) {
      for (let i = 0; i < mutationsList.length; i += 1) {
        for (let a = 0; a < mutationsList[i].addedNodes?.length; a += 1) {
          if (mutationsList[i].addedNodes[a].classList?.contains('lyrics-lyricsContent-provider')) {
            setLyricsPageProperties();
            revealLyricsLines();
          }
        }
      }
    }

    waitForElement(['.lyrics-lyricsContent-provider'], async () => {
      setLyricsPageProperties();
      revealLyricsLines();
    });

    // eslint-disable-next-line no-undef
    if (typeof lyricsObserver === 'undefined' || lyricsObserver == null) {
      waitForElement(['.lyrics-lyrics-contentWrapper'], () => {
        const lyricsContentWrapper = document.getElementsByClassName(
          'lyrics-lyrics-contentWrapper'
        )[0];
        const lyricsObserver = new MutationObserver(lyricsCallback);
        const lyricsObserverConfig = { childList: true };
        lyricsObserver.observe(lyricsContentWrapper, lyricsObserverConfig);
      });
    }
  }

  let previousAlbumUri;

  async function updateLyricsBackdrop() {
    waitForElement(['#lyrics-backdrop'], () => {
      const currentTrackMetadata = Spicetify.Player.data.track.metadata;

      // don't animate backdrop if artwork didn't change
      if (previousAlbumUri === currentTrackMetadata.album_uri) {
        return;
      }
      previousAlbumUri = currentTrackMetadata.album_uri;

      const lyricsBackdrops = document.querySelectorAll('#lyrics-backdrop');
      const lyricsBackdropPrevious = lyricsBackdrops[lyricsBackdrops.length - 1];

      for (let i = 0; i < lyricsBackdrops.length - 1; i += 1) {
        lyricsBackdrops[i].remove();
      }

      const lyricsBackdrop = document.createElement('img');
      lyricsBackdrop.id = 'lyrics-backdrop';
      lyricsBackdrop.src = currentTrackMetadata.image_xlarge_url;

      lyricsBackdropPrevious.insertAdjacentElement('afterend', lyricsBackdrop);

      lyricsBackdrop.addEventListener('load', () => {
        lyricsBackdrop.className = 'lyrics-backdrop-animate';
      });
    });
  }
  async function onSongChange() {
    updateLyricsPageProperties();
    updateLyricsBackdrop();
  }

  Spicetify.Player.addEventListener('songchange', onSongChange);

  function initLyricsBackdrop() {
    waitForElement(['.under-main-view'], () => {
      const underMainView = document.querySelector('.under-main-view');
      const lyricsBackdropContainer = document.createElement('div');
      lyricsBackdropContainer.id = 'lyrics-backdrop-container';
      underMainView.prepend(lyricsBackdropContainer);

      const lyricsBackdrop = document.createElement('div');
      lyricsBackdrop.style.backgroundColor = 'var(--spice-main)';
      lyricsBackdrop.id = 'lyrics-backdrop';
      lyricsBackdropContainer.appendChild(lyricsBackdrop);

      updateLyricsBackdrop();
    });
  }

  function addCategoryCardBackdrop() {
    waitForElement(['.x-categoryCard-image'], () => {
      const cards = document.getElementsByClassName('x-categoryCard-CategoryCard');
      const cardImages = document.getElementsByClassName('x-categoryCard-image');
      for (let i = 0; i < cards.length; i += 1) {
        let cardBackdrop = cardImages[i].previousSibling;
        if (cardBackdrop == null) {
          cardBackdrop = document.createElement('div');
          cardBackdrop.classList.add('x-categoryCard-backdrop');
          cardBackdrop.style.backgroundImage = `url(${cardImages[i].src})`;
          cardBackdrop.style.backgroundColor = `${cards[i].style.backgroundColor}`;
          cardImages[i].parentNode.insertBefore(cardBackdrop, cardImages[i]);
        }
      }
    });
  }

  function onPageChange() {
    const lyricsBackdropContainer = document.getElementById('lyrics-backdrop-container');

    if (Spicetify.Platform.History.location.pathname.includes('lyrics')) {
      if (lyricsBackdropContainer == null) {
        initLyricsBackdrop();
      } else {
        lyricsBackdropContainer.style.display = 'unset';
        updateLyricsPageProperties();
      }
    } else {
      if (lyricsBackdropContainer != null) {
        lyricsBackdropContainer.style.display = 'none';
      }
      if (Spicetify.Platform.History.location.pathname === '/search') {
        addCategoryCardBackdrop();
      }
    }
  }

  function lyricsCinemaCallback(mutationsList) {
    const lyricsBackdropContainer = document.getElementById('lyrics-backdrop-container');
    const lyricsCinema = mutationsList[0].target;

    if (lyricsCinema.classList.contains('main-lyricsCinema-lyricsCinemaVisible')) {
      if (lyricsBackdropContainer == null) {
        initLyricsBackdrop();
      } else {
        lyricsBackdropContainer.style.display = 'unset';
        updateLyricsPageProperties();
      }
    } else if (
      lyricsBackdropContainer != null &&
      !Spicetify.Platform.History.location.pathname.includes('lyrics')
    ) {
      lyricsBackdropContainer.style.display = 'none';
    }
  }

  function waitForHistoryAPI(func, timeout = 100) {
    if (Spicetify.Platform?.History) {
      func();
    } else if (timeout > 0) {
      setTimeout(waitForHistoryAPI, 100, func, timeout - 1);
    }
  }

  waitForHistoryAPI(() => {
    Spicetify.Platform.History.listen(onPageChange);
    onPageChange();

    waitForElement(['.Root__lyrics-cinema'], () => {
      const lyricsCinema = document.getElementsByClassName('Root__lyrics-cinema')[0];
      const lyricsCinemaObserver = new MutationObserver(lyricsCinemaCallback);
      const lyricsCinemaObserverConfig = {
        attributes: true,
        attributeFilter: ['class'],
      };
      lyricsCinemaObserver.observe(lyricsCinema, lyricsCinemaObserverConfig);
    });
  });

  function centerTopbar() {
    waitForElement(['.main-topBar-topbarContentWrapper'], () => {
      const topBarContentWrapper = document.getElementsByClassName(
        'main-topBar-topbarContentWrapper'
      )[0];

      const left = topBarContentWrapper.offsetLeft;
      const right = window.innerWidth - (left + topBarContentWrapper.offsetWidth);

      const max = window.innerWidth / 2;
      if (left <= 0 || right <= 0 || left > max || right > max) {
        return;
      }

      let diff;
      if (topBarContentWrapper.style.marginLeft !== '') {
        diff = right - left + parseInt(topBarContentWrapper.style.marginLeft, 10);
      } else {
        diff = right - left;
      }

      if (diff !== 0) {
        topBarContentWrapper.style.marginLeft = `${diff}px`;
      }
    });
  }
  window.addEventListener('load', centerTopbar);

  function rootObserverCallback(mutationsList, mutationObserver) {
    const regExp = /--panel-width:\s*([\d.]+)px/;
    const match = mutationsList[0].oldValue.match(regExp);
    const oldPanelWidth = match[1];
    setTimeout(() => {
      const newPanelWidth = parseInt(
        mutationsList[0].target.style.getPropertyValue('--panel-width'),
        10
      );
      if (newPanelWidth > oldPanelWidth) {
        const buddyFeedContainer = document.getElementsByClassName('main-buddyFeed-container')[0];
        buddyFeedContainer.style.width = `${oldPanelWidth}px`;
      }
      mutationObserver.disconnect();
    }, 0);
  }

  const rootObserver = new MutationObserver(rootObserverCallback);
  const rootObserverConfig = {
    attributes: true,
    attributeFilter: ['style'],
    attributeOldValue: true,
  };

  function keepRightSidebarWidth() {
    rootObserver.observe(document.documentElement, rootObserverConfig);
  }

  async function onResize() {
    keepRightSidebarWidth();
    centerTopbar();
    updateLyricsPageProperties();
  }
  window.onresize = onResize;

  // filepicker for custom folder images
  const filePickerForm = document.createElement('form');
  filePickerForm.setAttribute('aria-hidden', true);
  filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
  document.body.appendChild(filePickerForm);
  /** @type {HTMLInputElement} */
  const filePickerInput = filePickerForm.childNodes[0];
  filePickerInput.accept = [
    'image/jpeg',
    'image/apng',
    'image/avif',
    'image/gif',
    'image/png',
    'image/svg+xml',
    'image/webp',
  ].join(',');

  filePickerInput.onchange = () => {
    if (!filePickerInput.files.length) return;

    const file = filePickerInput.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const { result } = event.target;
      const { id } = Spicetify.URI.from(filePickerInput.uri);
      try {
        localStorage.setItem(`bloom:folder-image:${id}`, result);
      } catch {
        Spicetify.showNotification('File is too large');
      }
      updatePlaylistsImages();
    };
    reader.readAsDataURL(file);
  };

  // context menu items for custom folder images
  new Spicetify.ContextMenu.Item(
    'Remove folder image',
    ([uri]) => {
      const { id } = Spicetify.URI.from(uri);
      localStorage.removeItem(`bloom:folder-image:${id}`);
      updatePlaylistsImages();
    },
    ([uri]) => Spicetify.URI.isFolder(uri),
    'x'
  ).register();
  new Spicetify.ContextMenu.Item(
    'Choose folder image',
    ([uri]) => {
      filePickerInput.uri = uri;
      filePickerForm.reset();
      filePickerInput.click();
    },
    ([uri]) => Spicetify.URI.isFolder(uri),
    'edit'
  ).register();

  // fix backdrop-filter for some flyouts and menus
  // see https://github.com/nimsandu/spicetify-bloom/issues/220#issuecomment-1555071865
  function bodyCallback(mutationsList) {
    for (let i = 0; i < mutationsList.length; i += 1) {
      if (mutationsList[i].addedNodes[0]?.id?.includes('tippy')) {
        const tippy = mutationsList[i].addedNodes[0];
        const { body } = document;
        const { parentNode } = tippy;
        if (
          parentNode !== body &&
          !parentNode.classList?.contains('lyrics-tooltip-wrapper') &&
          !parentNode.classList?.contains('main-contextMenu-menuItem')
        ) {
          // inherit colors
          tippy.classList.add('encore-dark-theme');
          body.appendChild(tippy);
          // trigger element postition correction
          window.dispatchEvent(new Event('resize'));
        }
      }
    }
  }

  waitForElement(['body'], () => {
    const bodyObserver = new MutationObserver(bodyCallback);
    const bodyObserverConfig = {
      childList: true,
      subtree: true,
    };
    bodyObserver.observe(document.body, bodyObserverConfig);
  });

  function schemeCallback() {
    if (Spicetify.Config.color_scheme.includes('light')) {
      document.documentElement.style.setProperty('--noise-opacity', '3.5%');
    }
  }
  schemeCallback();

  waitForElement(['.marketplaceScheme'], () => {
    const scheme = document.getElementsByClassName('marketplaceScheme')[0];
    const schemeObserver = new MutationObserver(schemeCallback);
    const schemeObserverConfig = { attributes: true };
    schemeObserver.observe(scheme, schemeObserverConfig);
  });
})();
