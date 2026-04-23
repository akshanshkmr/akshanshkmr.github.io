export default {
     name: 'sudo',
     description: 'nice try',
     run: (_args, { renderBlock, scroll }) => {
          renderBlock(scroll, {
               type: 'error',
               header: 'sudo',
               bodyText: 'Permission denied: nice try.',
          });
     },
};

