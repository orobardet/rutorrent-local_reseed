<?php
require_once( '../../php/rtorrent.php' );
#require_once('conf.php');
eval(getPluginConf('local_reseed'));

$g_nReseed_Status = 1;
$g_sReseed_Error = "";
$g_sReseed_Msg = "";

if (empty($reseedDistantTarget)) {
	cachedEcho('{"status":0,"error":"Pas de destination FTP configurée pour envoyer le torrent local.","msg":""}',"application/json");
    return;
}

$action = "download";
if(isset($_REQUEST['action']))
	$action = $_REQUEST['action'];

if(isset($_REQUEST['result'])) {
	cachedEcho('noty(theUILang.cantFindTorrent,"error");',"text/html");
}

if(isset($_REQUEST['hash']) && $saveUploadedTorrents)
{
	$hash = $_REQUEST['hash'];
	// On force la sauvegarde du torrent dans la session
    $req = new rXMLRPCRequest( array(
            new rXMLRPCCommand("d.save_full_session", $hash)
    ));
	
    if($req->run() && !$req->fault)
    {
		// Ajout du hash dans la liste des hash autorisés du tracker local
//		exec("/usr/bin/sudo ".escapeshellcmd($opentrackerctl)." addhash ". escapeshellarg($hash). " 2>&1");
//		sleep(1);
		
		// Demande de réannonce (pour que le tracker local soit recontacté par rtorrent)
		$reqAnnounce = new rXMLRPCRequest( array(
				new rXMLRPCCommand("d.tracker_announce", $hash)
		));
		$reqAnnounce->run();
		
		$torrent = rTorrent::getSource($hash);
		if($torrent)
		{   
			$torrent->clear_announce();
			$torrent->clear_announce_list();
			$torrent->clear_comment();

			$torrent->announce($newTrackerUrl);
			$torrent->is_private(true);

			if ($action == "download")
			{
				$torrent->send("local_".$torrent->info['name'].".torrent");
			}	
			
			if ($action == "send")
			{
				$opts = array('ftp' => array('overwrite' => true));
				$context = stream_context_create($opts);
				$torrent_content = $torrent->__toString();
				$dst_target = $reseedDistantTarget."/local_".$torrent->info['name'].".torrent";
				
				if (file_put_contents($dst_target, $torrent_content, 0, stream_context_create(array(
                        'socket' => array(
                            'bindto' => '0:0', // force to use IPV4
                        ),
                    ))))
				{
					$g_nReseed_Status = 1;
					$g_sReseed_Msg = $torrent->info['name']." envoyé.";
				}
				else
				{
					$g_nReseed_Status = 0;
					$g_sReseed_Error = "Erreur lors de l'envoi de ".$torrent->info['name'];
				}
			}	
		}
	}	
}
if ($action == "download")
{
	header("HTTP/1.0 302 Moved Temporarily");
	header("Location: ".$_SERVER['PHP_SELF'].'?result=0');
}
else
{
	cachedEcho('{"status":'.$g_nReseed_Status.',"error":"'.$g_sReseed_Error.'","msg":"'.$g_sReseed_Msg.'"}',"application/json");
}
