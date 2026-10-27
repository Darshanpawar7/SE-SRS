import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {PriorityBadge,StatusBadge} from '../components/workspace/TaskSignals';
it('pairs non-colour labels and icons for every priority and lifecycle status',()=>{
 for(const p of ['low','medium','high','critical']) {const html=renderToStaticMarkup(React.createElement(PriorityBadge,{priority:p}));expect(html).toContain(`data-priority="${p}"`);expect(html).toContain('<svg');}
 expect(renderToStaticMarkup(React.createElement(StatusBadge,{status:'done'}))).toContain('Done');
 expect(renderToStaticMarkup(React.createElement(PriorityBadge,{priority:'invalid'}))).toContain('Unknown priority');
});
