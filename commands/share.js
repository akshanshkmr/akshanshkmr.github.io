export default {
     name: 'share',
     description: 'copy current URL to clipboard',
     run: async (_args, { showToast, renderBlock, scroll }) => {
          try {
               await navigator.clipboard.writeText(location.href);
               showToast('✓ link copied');
          } catch (err) {
               renderBlock(scroll, {
                    type: 'error',
                    header: 'clipboard blocked',
                    bodyText: `could not copy: ${err.message}. URL: ${location.href}`,
               });
          }
     },
};

