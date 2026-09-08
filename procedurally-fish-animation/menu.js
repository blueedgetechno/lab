function setupContextMenu(canvas) {
  const menu = document.querySelector('#context-menu');
  const submenu = document.querySelector('#submenu');
  let parentButton = null;

  function closeSubmenu() {
    submenu.hidden = true;
    parentButton?.setAttribute('aria-expanded', 'false');
    parentButton = null;
  }

  function closeMenu(focusCanvas = true) {
    closeSubmenu();
    menu.hidden = true;
    if (focusCanvas) canvas.focus({ preventScroll: true });
  }

  function place(panel, horizontal, vertical) {
    panel.hidden = false;
    panel.style.left = `${Math.max(8, Math.min(horizontal, innerWidth - panel.offsetWidth - 8))}px`;
    panel.style.top = `${Math.max(8, Math.min(vertical, innerHeight - panel.offsetHeight - 8))}px`;
  }

  function buttonFor(item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem');
    const mark = document.createElement('span');
    mark.className = 'mark';
    if (item.checked !== undefined) {
      button.setAttribute('aria-checked', String(item.checked));
      mark.innerHTML = '<i class="check" data-lucide="check"></i>';
    } else if (item.color) {
      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = palettes[item.color].body;
      mark.append(swatch);
    } else if (item.icon) {
      mark.innerHTML = `<i data-lucide="${item.icon}"></i>`;
    }
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;
    button.append(mark, label);
    if (item.children) {
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', 'false');
      button.insertAdjacentHTML('beforeend', '<i data-lucide="chevron-right"></i>');
      const open = () => {
        closeSubmenu();
        parentButton = button;
        button.setAttribute('aria-expanded', 'true');
        submenu.setAttribute('aria-label', item.label);
        submenu.replaceChildren(...item.children().map(buttonFor));
        lucide.createIcons();
        const bounds = button.getBoundingClientRect();
        const menuBounds = menu.getBoundingClientRect();
        submenu.hidden = false;
        let horizontal;
        if (menuBounds.right + submenu.offsetWidth <= innerWidth - 8) {
          horizontal = menuBounds.right - 1;
        } else if (menuBounds.left - submenu.offsetWidth >= 8) {
          horizontal = menuBounds.left - submenu.offsetWidth + 1;
        } else {
          place(menu, innerWidth - menu.offsetWidth - 8, menuBounds.top);
          horizontal = menu.getBoundingClientRect().left - submenu.offsetWidth + 1;
        }
        place(submenu, horizontal, bounds.top - 5);
      };
      button.addEventListener('pointerenter', open);
      button.addEventListener('click', () => { open(); submenu.querySelector('button').focus(); });
    } else {
      button.addEventListener('pointerenter', () => { if (button.parentElement === menu) closeSubmenu(); });
      button.addEventListener('click', () => { item.action(); closeMenu(); });
    }
    return button;
  }

  function openMenu(horizontal, vertical) {
    closeSubmenu();
    pointerInside = false;
    const gameItem = { label: game.active ? 'Stop game' : 'Play game', icon: game.active ? 'square' : 'play', action: () => game.active ? stopGame() : startGame() };
    const items = game.active ? [gameItem, { label: 'Restart game', icon: 'rotate-ccw', action: startGame }] : [
      gameItem,
      { label: 'Restart', icon: 'rotate-ccw', action: resetFish },
      { label: 'See ...', icon: 'eye', children: () => ['0 - Spine', '1 - Body circles', '2 - Outline', '3 - Finished fish'].map((label, value) => ({ label, checked: stage === value, action: () => { stage = value; } })) },
      { label: 'Follow mouse', checked: followMouse, action: () => { followMouse = !followMouse; } },
      { label: 'Speed', icon: 'gauge', children: () => [1, 2, 4].map(value => ({ label: `${value}x speed`, checked: playbackSpeed === value, action: () => { playbackSpeed = value; } })) },
      { label: 'Zoom', icon: 'zoom-in', children: () => [0.25, 0.5, 1].map(value => ({ label: `${value * 100}%`, checked: zoom === value, action: () => setZoom(value) })) },
      { label: 'Add a fish', icon: 'plus', children: () => [
        { label: 'Blue fish', color: 'blue', action: () => addFish('blue') },
        { label: '10 random fish', icon: 'shuffle', action: () => {
          const colors = ['blue', ...Object.keys(fishSpecies)];
          for (let index = 0; index < 10; index++) addFish(random(colors));
        } },
        ...Object.entries(fishSpecies).map(([color, species]) => ({ label: species.name, color, action: () => addFish(color) }))
      ] }
    ];
    menu.replaceChildren(...items.map(buttonFor));
    lucide.createIcons();
    place(menu, horizontal, vertical);
    menu.querySelector('button').focus();
  }

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    document.querySelector('#menu-hint').hidden = true;
    openMenu(event.clientX, event.clientY);
  });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      event.preventDefault();
      openMenu(innerWidth / 2, innerHeight / 2);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (event.button === 2) document.querySelector('#menu-hint').hidden = true;
    if (!menu.contains(event.target) && !submenu.contains(event.target)) closeMenu(false);
  });
  for (const panel of [menu, submenu]) {
    panel.addEventListener('contextmenu', event => event.preventDefault());
    panel.addEventListener('keydown', event => {
      const buttons = [...panel.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
      } else if (event.key === 'ArrowRight' && document.activeElement.hasAttribute('aria-haspopup')) {
        event.preventDefault();
        document.activeElement.click();
      } else if (event.key === 'ArrowLeft' && panel === submenu) {
        event.preventDefault();
        const parent = parentButton;
        closeSubmenu();
        parent?.focus();
      } else if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        closeMenu();
      }
    });
  }
  window.addEventListener('resize', () => closeMenu(false));
  window.addEventListener('blur', () => closeMenu(false));
}