{/* Content Body */}
<div className={`flex-grow mb-12 text-gray-800 leading-relaxed ${content?.includes('<') ? 'tiptap-content' : 'whitespace-pre-wrap'}`}>
   {content?.includes('<') ? (
      <div dangerouslySetInnerHTML={{ __html: content }} />
   ) : (
      content || "Aucun contenu disponible."
   )}
</div>