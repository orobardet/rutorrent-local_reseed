plugin.loadMainCSS();
plugin.loadLang(true);

if(plugin.canChangeMenu())
{
	theWebUI.getLocalTorrent = function( id )
	{
		$("#reseedaction").val("download");
		$("#reseedsrchash").val(id);
		$("#getlocaltorrent").submit();
	}

	theWebUI.sendLocalToNAS = function( id )
	{
		if (!id) {
			var table = theWebUI.getTable("trt");
			id = table.getFirstSelected();
		}
		if (id) {
			var AjaxReq = jQuery.ajax(
			{
				type: "GET",
				timeout: theWebUI.settings["webui.reqtimeout"],
					async : true,
					cache: false,
				url : "plugins/local_reseed/action.php?action=send&hash="+id,
				dataType : "json",
				cache: false,
				success : function(data)
				{
					if (data.status)
						noty(data.msg, 'success');
					else
						noty(data.error, 'error');
				},
				error : function(data, errorText, errorThrown)
				{
					noty(errorText+' : '+errorThrown, 'error');
				},
			});
		}
	}	
	
	plugin.createMenu = theWebUI.createMenu;
	theWebUI.createMenu = function( e, id )
	{
		plugin.createMenu.call(this, e, id);
		if(plugin.enabled)
		{
			var el = theContextMenu.get( theUILang.Properties );
			if (el)
			{
				var _c0 = [];
				_c0.push( [theUILang.sendLocalToNAS,
					(this.getTable("trt").selCount>1) ||
					(id.length>40) ? null : "theWebUI.sendLocalToNAS('" + id + "')"] );
				_c0.push( [theUILang.getLocalTorrent,
					(this.getTable("trt").selCount>1) ||
					(id.length>40) ? null : "theWebUI.getLocalTorrent('" + id + "')"] );
				theContextMenu.add( el, [CMENU_CHILD, theUILang.menuLocalReseed, _c0] );
			}
		}
	}
}

plugin.onLangLoaded = function()
{
	this.addButtonToToolbar("webuiSend2Nas", theUILang.sendLocalToNAS, "theWebUI.sendLocalToNAS()", "help");
	this.addSeparatorToToolbar("help");

	$(document.body).append($("<iframe name='srcfrm'/>").css({visibility: "hidden"}).attr( { name: "srcfrm", id: "srcfrm" } ).width(0).height(0).load(function()
	{
	        $("#srchash").val('');
		var d = (this.contentDocument || this.contentWindow.document);
		if(d && (d.location.href != "about:blank"))
			try { eval(d.body.innerHTML); } catch(e) {}
	}));
	$(document.body).append(
		$('<form action="plugins/local_reseed/action.php" id="getlocaltorrent" method="get" target="srcfrm">'+
			'<input type="hidden" name="action" id="reseedaction" value="">'+
			'<input type="hidden" name="hash" id="reseedsrchash" value="">'+
		'</form>').width(0).height(0));
}

plugin.onRemove = function()
{
	$('#srcfrm').remove();
	$('#getsource').remove();
	this.removeSeparatorFromToolbar("webuiSend2Nas");
	this.removeButtonFromToolbar("webuiSend2Nas");
}