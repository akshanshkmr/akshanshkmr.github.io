export default {
     name: 'clear',
     description: 'wipe the scroll',
     run: (_args, { clearScroll, scroll }) => {
          clearScroll(scroll);
     },
};

