export default {
     name: 'barrel-roll',
     description: 'do a barrel roll!',
     run: (_args, { renderBlock, scroll }) => {
          document.body.classList.add('barrel-rolling');
          
          renderBlock(scroll, {
               type: 'tool',
               header: 'barrel-roll',
               bodyText: 'doing a barrel roll…',
          });

          // Match the 1.5s CSS transition timing to clean up class
          setTimeout(() => {
               document.body.classList.remove('barrel-rolling');
          }, 1500);
     }
};
