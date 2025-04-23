import moduleAlias from 'module-alias';
import path from 'path';

// Add path aliases
moduleAlias.addAliases({
  '@database': path.join(__dirname, '../database'),
}); 